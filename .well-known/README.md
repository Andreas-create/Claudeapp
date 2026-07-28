# Digital Asset Links

`assetlinks.json` is what lets the Android app (a Trusted Web Activity) run
Brainbow **without a browser URL bar**. Android fetches it from
`https://<origin>/.well-known/assetlinks.json` and checks that this site
vouches for the app's signing key. If it does not match, the app still works
but shows the address bar — which looks like a browser, not an app.

## Before publishing you must fill in two values

1. **`package_name`** — the Android application id you choose when you build
   the package. The placeholder here matches the origin, but any reverse-domain
   string works as long as it is identical in the app and in this file. It can
   never be changed after the first Play release.

2. **`sha256_cert_fingerprints`** — the SHA-256 fingerprint of the key the app
   is *signed with*. Use the one Play shows for the **app signing key**, not the
   upload key: Play Console → your app → Test and release → Setup → App signing.
   Copy the "SHA-256 certificate fingerprint" (colon-separated hex).

   Google re-signs your upload with its own key, so using the upload key's
   fingerprint is the single most common reason verification fails.

## After deploying, check it is actually served

```bash
curl -s https://brainbow-puzzle.github.io/.well-known/assetlinks.json
```

It must return this JSON, not a 404. The repo has a `.nojekyll` file so the
dot-directory is not stripped during the Pages build.

Then verify the association end to end:
https://developers.google.com/digital-asset-links/tools/generator

## If the site ever moves to a custom domain

This file is origin-scoped. Moving domains breaks the association and the app
starts showing a URL bar until a new build points at the new origin. Decide the
final domain **before** the first Play release.
