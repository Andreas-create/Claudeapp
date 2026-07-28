# Play Store assets

Generated from the real app, not mocked up. Regenerate whenever the UI changes
so the listing never shows a version that no longer exists.

| File | Size | Play slot |
|---|---|---|
| `feature-graphic.png` | 1024×500 | Feature graphic (required) |
| `01-home.png` … `06-levels.png` | 1080×1920 | Phone screenshots (2–8 allowed) |
| `feature-graphic.html` | — | Source for the feature graphic |

The app icon comes straight from `icons/icon-512.png`.

## Regenerating

```bash
npm install --no-save playwright@latest
python3 -m http.server 8099 --bind 0.0.0.0 &
NODE_PATH=$PWD/node_modules node store/generate.js
rm -rf node_modules package.json package-lock.json
```

`generate.js` paints a representative Word Guess board rather than solving a
level, so the palette is visible in one shot — everything else is the live app.

Listing copy and the Data Safety answers live in `../store-listing.md`.
