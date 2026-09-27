
(() => {
  const viewport = document.getElementById('viewport');

  // ---------- simple deterministic PRNG ----------
  function hashString(str){
    let h = 2166136261 >>> 0;
    for(let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a){
    return function(){
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  // ---------- local data ----------
  let balance = Number(localStorage.getItem('proto_balance_hkd') || '0');
  let visualCode = localStorage.getItem('proto_visual_code') || 'PROTOTYPE-000000000001';

  const defaultMethods = [
    {name:'CNCBI UnionPay', digits:'2034', badge:'CN', color:'#d71920'},
    {name:'UnionPay', digits:'6876', badge:'UP', color:'#286c59'},
    {name:'CCB (Asia) Visa', digits:'6331', badge:'C', color:'#116bb3'},
    {name:'BOC Visa', digits:'0017', badge:'B', color:'#b10035'},
    {name:'Citi Mastercard', digits:'2401', badge:'citi', color:'#4a306d'}
  ];

  let methods;
  try{
    methods = JSON.parse(localStorage.getItem('proto_methods')) || defaultMethods;
    if(!Array.isArray(methods) || methods.length < 1) methods = defaultMethods;
  }catch(e){ methods = defaultMethods; }

  let selected = Number(localStorage.getItem('proto_selected_method') || '2');
  if(selected < 0 || selected > methods.length) selected = Math.min(2, methods.length - 1);
  if(selected === methods.length && balance <= 0) selected = Math.min(2, methods.length - 1);

  const homeBalanceValue = document.getElementById('homeBalanceValue');
  const balancePageValue = document.getElementById('balancePageValue');
  const balanceInput = document.getElementById('balanceInput');
  const currentMethod = document.getElementById('currentMethod');
  const currentBadge = document.getElementById('currentBadge');
  const methodList = document.getElementById('methodList');
  const editRows = document.getElementById('editRows');
  const editPanel = document.getElementById('editPanel');
  const codeInput = document.getElementById('codeInput');
  const codeNumber = document.getElementById('codeNumber');

  function formatMoney(n){
    return 'HK$' + Number(n).toLocaleString('en-HK',{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function renderBalance(){
    homeBalanceValue.textContent = formatMoney(balance);
    balancePageValue.textContent = Number(balance).toLocaleString('en-HK',{
      minimumFractionDigits:2,
      maximumFractionDigits:2
    });
  }

  function renderCurrentMethod(){
    if(selected === methods.length && balance > 0){
      currentMethod.textContent = `Balance(${formatMoney(balance)} left)`;
      currentBadge.textContent = '$';
      currentBadge.style.background = '#f8c93c';
      return;
    }
    if(selected < 0 || selected >= methods.length) selected = Math.min(2, methods.length - 1);
    const m = methods[selected];
    currentMethod.textContent = `${m.name}(${m.digits})`;
    currentBadge.textContent = m.badge || m.name.slice(0,2);
    currentBadge.style.background = m.color || '#116bb3';
  }

  // ---------- visual-only barcode ----------
  function drawBarcode(seedText){
    const c = document.getElementById('barcodeCanvas');
    const ctx = c.getContext('2d');
    const rand = mulberry32(hashString(seedText + '|BAR'));
    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,c.width,c.height);

    let x = 18;
    const maxX = c.width - 18;
    ctx.fillStyle = '#000';
    while(x < maxX){
      const gap = 3 + Math.floor(rand()*7);
      x += gap;
      const w = 3 + Math.floor(rand()*10);
      if(x+w > maxX) break;
      ctx.fillRect(x, 10, w, c.height-20);
      x += w;
    }
  }

  // ---------- visual-only QR-like matrix ----------
  function drawQR(seedText){
    const c = document.getElementById('qrCanvas');
    const ctx = c.getContext('2d');
    const N = 29;
    const cell = c.width / N;
    const rand = mulberry32(hashString(seedText + '|QR'));
    const grid = Array.from({length:N},()=>Array(N).fill(false));

    function finder(x0,y0){
      for(let y=0;y<7;y++){
        for(let x=0;x<7;x++){
          const edge = x===0 || x===6 || y===0 || y===6;
          const core = x>=2 && x<=4 && y>=2 && y<=4;
          grid[y0+y][x0+x] = edge || core;
        }
      }
    }
    finder(1,1); finder(N-8,1); finder(1,N-8);

    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        const reserved =
          (x>=1&&x<=7&&y>=1&&y<=7) ||
          (x>=N-8&&x<=N-2&&y>=1&&y<=7) ||
          (x>=1&&x<=7&&y>=N-8&&y<=N-2);
        if(!reserved) grid[y][x] = rand() > .52;
      }
    }

    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#000';
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        if(grid[y][x]){
          ctx.fillRect(Math.floor(x*cell),Math.floor(y*cell),Math.ceil(cell),Math.ceil(cell));
        }
      }
    }
  }

  function renderCode(){
    codeInput.value = visualCode;
    codeNumber.textContent = visualCode;
    drawBarcode(visualCode);
    drawQR(visualCode);
  }

  // ---------- page navigation ----------
  document.getElementById('moneyBtn').addEventListener('click',()=>{
    viewport.classList.remove('balance-open');
    viewport.classList.add('money-open');
    document.getElementById('moneyPage').scrollTop = 0;
  });
  document.getElementById('moneyBack').addEventListener('click',()=>{
    viewport.classList.remove('money-open');
  });

  document.getElementById('homeBalanceBtn').addEventListener('click',()=>{
    viewport.classList.remove('money-open');
    viewport.classList.add('balance-open');
    document.getElementById('balancePage').scrollTop = 0;
  });
  document.getElementById('balanceClose').addEventListener('click',()=>{
    viewport.classList.remove('balance-open');
  });

  // ---------- generic overlay close ----------
  document.querySelectorAll('[data-close]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.getElementById(btn.dataset.close).classList.remove('open');
    });
  });
  document.querySelectorAll('.center-overlay').forEach(ov=>{
    ov.addEventListener('click',e=>{
      if(e.target===ov) ov.classList.remove('open');
    });
  });

  // ---------- balance ----------
  document.getElementById('balanceAmountButton').addEventListener('click',()=>{
    balanceInput.value = balance.toFixed(2);
    document.getElementById('balanceModal').classList.add('open');
    setTimeout(()=>balanceInput.focus(),0);
  });
  document.getElementById('saveBalance').addEventListener('click',()=>{
    let n = Number(balanceInput.value);
    if(!Number.isFinite(n) || n < 0) n = 0;
    balance = n;
    localStorage.setItem('proto_balance_hkd', String(balance));
    if(selected === methods.length && balance <= 0){
      selected = Math.min(2, methods.length - 1);
      localStorage.setItem('proto_selected_method',String(selected));
    }
    renderBalance();
    renderCurrentMethod();
    if(sheet.classList.contains('open')) renderMethodList();
    document.getElementById('balanceModal').classList.remove('open');
  });

  // ---------- payment code editor ----------
  function openCodeEditor(){
    codeInput.value = visualCode;
    document.getElementById('codeModal').classList.add('open');
    setTimeout(()=>codeInput.focus(),0);
  }
  document.getElementById('barcodeBtn').addEventListener('click',openCodeEditor);
  document.getElementById('qrBtn').addEventListener('click',openCodeEditor);
  document.getElementById('merchantMore').addEventListener('click',openCodeEditor);

  document.getElementById('saveCode').addEventListener('click',()=>{
    const v = codeInput.value.trim() || 'PROTOTYPE-000000000001';
    visualCode = v;
    localStorage.setItem('proto_visual_code',visualCode);
    renderCode();
    document.getElementById('codeModal').classList.remove('open');
  });

  document.getElementById('codeHint').addEventListener('click',()=>{
    codeNumber.classList.toggle('hidden');
    document.getElementById('codeHint').textContent =
      codeNumber.classList.contains('hidden')
        ? 'Tap to view payment code number'
        : 'Tap to hide payment code number';
  });

  // ---------- method sheet ----------
  const sheet = document.getElementById('methodSheet');

  function bankLogoClass(m){
    const n = String(m.name || '').toLowerCase();
    if(n.includes('cncbi')) return 'logo-cn';
    if(n === 'unionpay' || n.startsWith('unionpay')) return 'logo-up';
    if(n.includes('ccb')) return 'logo-ccb';
    if(n.includes('boc')) return 'logo-boc';
    if(n.includes('citi')) return 'logo-citi';
    return '';
  }

  function renderMethodList(){
    methodList.innerHTML = '';
    methods.forEach((m,i)=>{
      const row = document.createElement('div');
      row.className='method-row';
      const logoClass = bankLogoClass(m);
      const logoText = logoClass === 'logo-citi' ? 'citi' :
                       logoClass === 'logo-up' ? 'UP' :
                       logoClass ? '' : (m.badge || m.name.slice(0,2)).replace(/[<>]/g,'');
      row.innerHTML = `
        <div class="method-logo ${logoClass}" style="${logoClass ? '' : `background:${m.color || '#666'}`}">${logoText}</div>
        <div class="method-row-title">${escapeHTML(m.name)}(${escapeHTML(m.digits)})</div>
        <div class="tick">${i===selected?'✓':''}</div>
      `;
      row.addEventListener('click',()=>{
        selected = i;
        localStorage.setItem('proto_selected_method',String(selected));
        renderCurrentMethod();
        renderMethodList();
        setTimeout(()=>sheet.classList.remove('open'),120);
      });
      methodList.appendChild(row);
    });

    const balanceRow = document.createElement('div');
    const hasBalance = balance > 0;
    balanceRow.className = 'method-row ' + (hasBalance ? 'balance-available' : 'balance-unavailable');
    balanceRow.innerHTML = `
      <div class="method-logo" style="background:#f8c93c">$</div>
      <div>
        <div class="method-row-title">Balance(${formatMoney(balance)} left)</div>
        ${hasBalance ? '<div class="method-sub">Available balance</div>' : '<div class="method-sub">Insufficient balance</div>'}
      </div>
      <div class="tick">${selected===methods.length && hasBalance ? '✓' : ''}</div>
    `;
    if(hasBalance){
      balanceRow.addEventListener('click',()=>{
        selected = methods.length;
        localStorage.setItem('proto_selected_method',String(selected));
        renderCurrentMethod();
        renderMethodList();
        setTimeout(()=>sheet.classList.remove('open'),120);
      });
    }
    methodList.appendChild(balanceRow);
  }

  function renderEditRows(){
    editRows.innerHTML='';
    methods.forEach((m,i)=>{
      const wrap = document.createElement('div');
      wrap.className='edit-method-row';
      wrap.innerHTML = `
        <input data-name="${i}" value="${escapeAttr(m.name)}" aria-label="Card name ${i+1}">
        <input data-digits="${i}" value="${escapeAttr(m.digits)}" maxlength="8" aria-label="Bracket number ${i+1}">
      `;
      editRows.appendChild(wrap);
    });
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }
  function escapeAttr(s){ return escapeHTML(s); }

  document.getElementById('methodButton').addEventListener('click',()=>{
    renderMethodList();
    renderEditRows();
    editPanel.classList.remove('open');
    document.getElementById('toggleEdit').textContent='Edit';
    sheet.classList.add('open');
  });
  document.getElementById('closeSheet').addEventListener('click',()=>sheet.classList.remove('open'));
  sheet.addEventListener('click',e=>{ if(e.target===sheet) sheet.classList.remove('open'); });

  document.getElementById('toggleEdit').addEventListener('click',()=>{
    const willOpen = !editPanel.classList.contains('open');
    editPanel.classList.toggle('open',willOpen);
    document.getElementById('toggleEdit').textContent = willOpen ? 'Done' : 'Edit';
    if(willOpen) renderEditRows();
  });

  document.getElementById('saveMethods').addEventListener('click',()=>{
    methods = methods.map((m,i)=>{
      const nameEl = document.querySelector(`[data-name="${i}"]`);
      const digitsEl = document.querySelector(`[data-digits="${i}"]`);
      return {
        ...m,
        name:(nameEl.value.trim() || m.name).slice(0,40),
        digits:(digitsEl.value.trim() || m.digits).slice(0,8)
      };
    });
    localStorage.setItem('proto_methods',JSON.stringify(methods));
    renderCurrentMethod();
    renderMethodList();
    renderEditRows();
    editPanel.classList.remove('open');
    document.getElementById('toggleEdit').textContent='Edit';
  });

  // initial render
  renderBalance();
  renderCurrentMethod();
  renderCode();
})();
