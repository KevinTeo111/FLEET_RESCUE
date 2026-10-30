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

1. **Request destination.** Requests go through Web3Forms (`FORM_ENDPOINT` and `WEB3FORMS_ACCESS_KEY` in `script.js`) to the email the access key was created with. To change the destination email, create a new key at web3forms.com and replace the value. Emptying `FORM_ENDPOINT` puts the page back in preview mode (simulated send, payload logged to the browser console).
2. **Photos.** File attachments are a Web3Forms Pro feature. `ATTACH_PHOTOS` is `false`, which hides the photo field. After upgrading, set it to `true` and send one test with a photo.
3. **HTTPS.** The browser only allows GPS on a secure origin. Confirm SSL is active on the domain.
4. **Privacy link.** The footer "Privacy" link points to `#`. Replace it or remove it.

## Configuration

All editable values sit at the top of `script.js`:

```js
var FORM_ENDPOINT = "https://api.web3forms.com/submit";
var WEB3FORMS_ACCESS_KEY = "...";  // public key from web3forms.com
var ATTACH_PHOTOS = false;         // true only on a Web3Forms Pro plan
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
