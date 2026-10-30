# Fleet Rescue — Roadside Assistance Page

Single static page for truck and trailer roadside assistance requests. No build step, no framework.

## Deploy files

Upload these five files to the web root of the hosting account:

| File | Purpose |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Styles (design tokens at the top) |
| `script.js` | GPS capture, validation, photo upload, submission |
| `hero.jpg` | Hero photo (1817 × 866, from `source-assets/hero_background.png`) |
| `logo.png` | Header and footer logo (720 px web copy) |

Everything in `source-assets/` is original artwork and the approved design mockup. It is not needed on the server.

## Before go-live

1. **Request destination.** In `script.js`, set `FORM_ENDPOINT` to the form service URL (Formspree, Web3Forms, or a mail script on the host). While it is empty the page runs in preview mode: submissions succeed locally and the payload is logged to the browser console. Photo attachments require a form service plan that accepts files.
2. **HTTPS.** The browser only allows GPS on a secure origin. Confirm SSL is active on the domain.
3. **Privacy link.** The footer "Privacy" link points to `#`. Replace it or remove it.

## Configuration

All editable values sit at the top of `script.js`:

```js
var FORM_ENDPOINT = "";            // form delivery URL
var DISPATCH_PHONE_DISPLAY = "984-315-3301";
var DISPATCH_PHONE_TEL = "tel:9843153301";
var GPS_TIMEOUT_MS = 12000;
var MAX_PHOTOS = 3;
var MAX_PHOTO_MB = 8;
```

The dispatch number also appears in `tel:` links throughout `index.html`. Search for `9843153301` to change it everywhere.

Dropdown options (truck type, repair type) and the service area and hours copy are plain HTML in `index.html`.

## Testing checklist

- GPS: allow, deny, and timeout on a phone and on desktop
- Form: submit empty, bad phone, valid, and double-click submit
- Photos: more than three, oversized file, non-image file, remove a file
- Delivery: confirm the email arrives and the map link opens at the right spot
- Devices: iPhone, Android, desktop at narrow and wide widths
