# Pay & Services Prototype — V12

GitHub Pages-ready static prototype.

## V12 changes

- Money title remains pinned at the top while the page content scrolls.
- Pay Merchant `•••` opens a bottom action sheet.
- `Disable temporarily` opens a confirmation alert.
- Confirming `Disable` replaces the visual barcode / QR area with the disabled Quick Pay view.
- `Enable now` restores the visual barcode / QR area.
- Quick Pay enabled/disabled state persists in `localStorage`.
- Text/UI selection and page zoom gestures are disabled.
- Existing Money, Balance, payment-method, card-edit and localStorage functionality remains.

## Structure

- `index.html`
- `css/styles.css`
- `js/app.js`
- `assets/icons/*.svg`

No build step is required.

## GitHub Pages

Push the contents of this folder to the repository root and enable:

**Settings → Pages → Deploy from a branch → main → /(root)**

## Prototype note

The QR/barcode graphics are visual-only patterns and are not valid payment credentials.
