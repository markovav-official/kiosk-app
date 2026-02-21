# Kiosk App

Electron app scaffold with a **portable Windows build** (single `.exe`, no installer).

## Setup

```bash
npm install
```

## Run locally

```bash
npm start
```

## Build portable Windows executable

Build the portable `.exe` (run from any folder, no install, no admin):

```bash
npm run build:win
```

Output: `dist/Kiosk App-1.0.0-portable.exe`

To build only the unpacked app directory (faster, for testing):

```bash
npm run build:win:dir
```

**Note:** Portable and Windows builds are produced on Windows (or on macOS/Linux via Wine/VM). For CI, use a Windows runner or a cross-compilation setup.

## Project layout

- `main.js` – main process (window, app lifecycle)
- `preload.js` – preload script (safe bridge to renderer)
- `index.html` / `renderer.js` – renderer UI
- `package.json` – scripts and electron-builder config (`win.target: portable`)

## Optional: Windows icon

Add `build/icon.ico` and in `package.json` under `build.win` add:

```json
"icon": "build/icon.ico"
```

Then rebuild with `npm run build:win`.
