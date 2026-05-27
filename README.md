# SportyKore (Expo / React Native)

## Prerequisites

- **Node.js**: use an LTS version (recommended).
- **npm**: comes with Node.
- **Expo CLI**: run via `npx expo ...` (no global install required).

### iOS (Mac)

- **Xcode** (from the App Store)
- **Xcode Command Line Tools**

```bash
xcode-select --install
```

### Android (optional)

- **Android Studio** + an Android emulator (AVD)

## Install

```bash
npm install
```

## Environment variables

Create a `.env` (or set in your shell) for the API base URL:

```bash
EXPO_PUBLIC_API_URL="http://127.0.0.1:3333"
```

Notes:
- On a **physical device**, `127.0.0.1` points to the device. Use your computer’s LAN IP (e.g. `http://192.168.0.x:3333`).
- Keep client env vars prefixed with **`EXPO_PUBLIC_`**.

## Running the app

SportyKore uses a **development build (dev client)** because it includes native modules (e.g. local authentication, screen orientation). Expo Go may not work for everything.

### Start Metro

```bash
npx expo start --dev-client
```

### iOS Simulator (recommended)

1. Open Xcode once (accept licenses if prompted).
2. Build and install the dev client into the simulator:

```bash
npm run ios
```

3. With Metro running, press `i` (or open the installed dev client in the simulator and connect).

### Android emulator

1. Start an emulator in Android Studio.
2. Build and install the dev client:

```bash
npm run android
```

3. With Metro running, press `a`.

## When you must rebuild the dev client

If you add or change **native dependencies** (anything that requires native code), you must rebuild:

```bash
npm run ios
# or
npm run android
```

Symptoms of an out-of-date dev client include errors like:
- `Cannot find native module 'ExpoLocalAuthentication'`
- `Cannot find native module 'ExpoScreenOrientation'`

## Project structure (quick)

- `app/`: Expo Router route files (thin wrappers only)
- `src/`: features, UI components, API layer, hooks

## Docs

- `documentations/ROUTES.md`: backend route shapes
- `documentations/MANAGE_LEAGUE.md`: manage flow + API calls
