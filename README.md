# Spar Timer

Spar Timer is a responsive sparring-round timer for boxing, martial arts, MMA, wrestling, fitness circuits, and other interval-based training. It is a client-side Progressive Web App — no backend, accounts, or external APIs required.

**Live demo (GitHub Pages):** https://ccavins.github.io/Sparring-Rounds-Timer/

## Features

- Configure rounds, round duration, rest duration, and optional preparation countdown
- Combat-sport presets (Boxing, Amateur Boxing, MMA, Muay Thai) plus Custom
- Large, gym-readable countdown with distinct sparring / rest / prep / paused / complete states
- Drift-resistant timer engine based on absolute timestamps (`performance.now()`)
- Pause / resume with exact remaining time preserved
- Skip phase (with confirmation for active sparring rounds) and end-session confirmation
- Loud Web Audio bells, warning tones, volume control, optional vibration
- Fullscreen mode and Screen Wake Lock where supported
- Keyboard shortcuts (Space, Enter, ArrowRight, F, Escape)
- Local storage persistence for last-used settings
- Installable PWA with offline support after first load
- Accessibility: semantic HTML, focus states, ARIA labels, phase announcements, reduced motion

## Tech stack

- Vue 3 + TypeScript + Vite
- Composition API
- Native CSS variables and responsive layouts
- Vitest for timer-logic unit tests
- Playwright for critical end-to-end tests
- `vite-plugin-pwa` for manifest + service worker

## Local installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

For GitHub Pages (project site under `/Sparring-Rounds-Timer/`):

```bash
npm run build:gh
```

## Testing

```bash
# Unit tests
npm test

# Lint
npm run lint

# Typecheck
npm run typecheck

# End-to-end (requires a production build first for preview server)
npm run build
npx playwright install chromium
npm run test:e2e
```

## PWA behavior

- Manifest name: **Spar Timer** / short name: **SparTimer**
- Standalone display mode, theme color `#0a0a0b`
- Service worker precaches the app shell (HTML/CSS/JS/fonts/icons)
- Audio is synthesized at runtime with the Web Audio API (no fragile audio-file cache that can block updates)
- Fonts are self-hosted via `@fontsource` packages and cached with a versioned cache name

## Audio implementation

Sounds are generated with the Web Audio API on device:

| Event | Sound |
| --- | --- |
| Prep final 3 seconds | Short beep |
| Round start | Bright ascending bell |
| 10-second warning | Double warning tone |
| Round end | Lower descending bell |
| Workout complete | Distinct rising sequence |

Audio unlocks from a user gesture (`Start Timer` or `Test Sound`). If the browser blocks audio, a clear notice is shown on the setup screen.

## Browser compatibility notes

- Modern Chromium, Firefox, and Safari are supported
- Fullscreen API works on most desktop browsers; iOS Safari is limited — add to Home Screen for a more app-like experience
- Screen Wake Lock is supported in Chromium-based browsers; unsupported browsers fail gracefully
- Vibration requires a supporting mobile browser and is optional
- Tab throttling is handled by recalculating from absolute timestamps and syncing on `visibilitychange`

## Fullscreen and wake-lock limitations

- Fullscreen may require a user gesture and can be unavailable in some embedded or iOS contexts
- Wake Lock is released when the workout completes, the session ends, or the component unmounts
- Wake Lock is re-requested after the page becomes visible again while a session is active

## Deployment

### GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml`.

1. In the GitHub repo: **Settings → Pages → Source: GitHub Actions**
2. Push to `main` (or run the workflow manually)
3. Site URL: `https://<user>.github.io/Sparring-Rounds-Timer/`

Manual deploy alternative:

```bash
npm run deploy:gh
```

### Firebase Hosting

```bash
npm run build
npx firebase init hosting   # public directory: dist, single-page app: yes
npx firebase deploy
```

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Add a redirect for SPA fallback: `/* /index.html 200`

### Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Project structure

```
src/
  components/     UI building blocks
  composables/    Timer engine, audio, fullscreen, wake lock
  types/          Shared TypeScript models
  utils/          Duration helpers and localStorage
  views/          Setup, running timer, completion screens
e2e/              Playwright tests
public/           Icons and favicon
```

## Default settings

- 5 rounds
- 3:00 round duration
- 1:00 rest duration
- 10-second preparation countdown

## License

Source code in this repository is available for use with the project. App branding, layout, and assets are original to Spar Timer.
