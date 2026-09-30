# Animal Sightings — Static Firebase Demo

This version intentionally uses **no npm, React, Vite, or build system**. It is plain HTML/CSS/JavaScript and Firebase's browser SDK loaded with `<script type="module">` imports.

## Files

- `index.html` — dashboard
- `login.html` — Firebase login/signup
- `chat.html` — public chat; verified accounts can post
- `device/index.html` — verified device console
- `js/firebase.js` — Firebase configuration
- `js/device.js` — sighting recording and Teachable Machine hook
- `firestore.rules` — basic security rules

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication -> Email/Password.
3. Create a Firestore database.
4. Add a Web App in Firebase and copy its configuration into `js/firebase.js`.
5. Deploy/paste the rules in `firestore.rules` into Firestore Rules.

### Verified account

The demo uses a Firebase Auth custom claim named `verified`.

A user needs:

```json
{
  "verified": true
}
```

on their Firebase ID token to:
- open the device console
- record sightings
- post chat messages

For a real project, set this claim using a trusted server/admin process. Do not allow a browser to set its own `verified` claim.

## Teachable Machine

The device page has a field for the model URL and saves it to that browser's local storage.

The current demonstration records sightings with buttons.

`js/device.js` exposes:

```javascript
window.recordSighting("Kangaroo");
```

A Teachable Machine prediction can call this function when its predicted class meets your confidence threshold.

A future integration can load the Teachable Machine model directly in the browser and map predictions to species without changing the Firestore sighting format.

## Running locally

Because browser module imports and Firebase work best from a web server, do not double-click the HTML files.

For a quick demonstration, use any simple static web server. For example, if Python is installed:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

No npm is required.

## Sighting document

Each sighting is stored as:

```text
sightings/{autoId}
  species
  timestamp
  deviceId
  recordedBy
```

This intentionally does not store individual animal IDs because this prototype only tracks sightings.
