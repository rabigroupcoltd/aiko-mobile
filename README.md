# Aiko

A fully clickable, frontend-only demo of **Aiko** — a dispatch/delivery app for
Minna, Niger State, Nigeria.

There is no backend. No Firebase, no auth API, no dispatch server. But this is
not a clickable mockup either — two things are genuinely real:

- **Liveness detection** — on-device ML Kit blink + head-turn checks. A printed
  photo held up to the camera will fail it.
- **The map** — real Google Maps tiles (needs one API key; see below).

Everything else is simulated locally: OTP accepts any 4-digit code, address
search filters a bundled list of real Minna landmarks, and rider matching is a
timed animation over hardcoded riders.

---

## Environment variables

**Two, both optional.** The app runs without either — each just unlocks a feature.

| Variable | Unlocks | Without it |
|---|---|---|
| `GOOGLE_MAPS_ANDROID_API_KEY` | Real Google map tiles | Booking screen shows a styled map placeholder |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | "Continue with Google" | The button is hidden; phone + OTP is the only way in |

Explicitly **not** needed: Firebase API keys (they're in `google-services.json` /
`GoogleService-Info.plist`, already committed), Google Places/Geocoding (address
search reads local JSON — that *is* the cache demo), any ML Kit key (face
detection runs on-device, bundled, free).

```bash
cp .env.example .env   # then fill in what you want
```

Changing `.env` requires a re-run of `npm run prebuild`.

### Firebase / Google Sign-In status

The project is wired to Firebase project **`aiko-7874b`**, package
**`com.aiko.app`**. Both config files are in the repo root and prebuild copies
them into place automatically.

> ⚠️ **Google Sign-In is not usable yet.** The supplied `google-services.json`
> has an **empty `oauth_client` array**, and `GoogleService-Info.plist` has no
> `CLIENT_ID`. These are the "bare" files you get when an app is registered but
> Google was never enabled as a sign-in provider. The integration is fully built
> and will work with no code changes once the credentials exist.

To enable it:

1. Firebase console → project `aiko-7874b`
2. **Authentication → Sign-in method → enable Google** — this is what creates the OAuth clients
3. **Project settings → Your apps → Android (`com.aiko.app`) → Add fingerprint**, using your debug SHA-1:
   ```
   keytool -list -v -keystore ~/.android/debug.keystore \
     -alias androiddebugkey -storepass android -keypass android
   ```
4. Re-download `google-services.json`, replace the one in the repo root
5. Copy the `client_id` of the entry with `"client_type": 3` into
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, then `npm run prebuild`

**It must be the *web* client ID (type 3), not the Android one.** Using the
Android client ID is the single most common cause of `DEVELOPER_ERROR` here.

### Push notifications

Ride events — a new job for a driver, a bid for a passenger, arrival, trip
completion, KYC approval — arrive over FCM as well as the socket. Nothing needs
configuring on this side: the same `google-services.json` above is what the
native SDK initialises from, and the server sends with its own service account.

Two things are worth knowing:

- **This half is `@react-native-firebase/*`, not the `firebase` JS package used
  for sign-in.** FCM has no JS-only path on React Native, so these are native
  modules and **a new dev build is required** — `npx expo prebuild` then
  `npx expo run:android`. A cached dev client will not pick them up.
- **Notifications are a fallback, never the source of truth.** Everything they
  carry is also a WebSocket broadcast; push exists for a client that is
  backgrounded or off the socket. A device that never gets permission still
  works, it just stops finding out about trips while in the background.

Verify a device end to end with `POST /api/notifications/test` once signed in —
`sent: 0` without an error means the *server* has no Firebase credentials, or
this device never registered.

There is deliberately **no custom Android notification channel**. Creating one
needs notifee (react-native-firebase dropped its display API), and naming a
channel the app has not created makes Android fall back to the manifest default
— which loses the heads-up banner rather than gaining it. The server leaves
`FCM_RIDE_CHANNEL_ID` unset to match.

### Maps key

Google Cloud Console → project `aiko-7874b` → enable **Maps SDK for Android** →
enable billing (the API 403s without a billing account) → Credentials → Create
API key. Optionally restrict to package `com.aiko.app` + your debug SHA-1.

---

## Running it

**Requires a physical Android device.** The liveness check needs a real camera —
emulator camera feeds do not drive ML Kit reliably. Expo Go will not work either;
VisionCamera v5 and the Nitro modules need a dev build.

```bash
npm install
npm run prebuild        # expo prebuild --clean
npm run android         # expo run:android  (device connected, USB debugging on)
```

Subsequent runs only need `npm start`.

```bash
npm test                # 30 liveness unit tests, no device needed
npm run typecheck
```

---

## Demo script

A full walkthrough, about three minutes:

1. **Welcome** → Continue with phone (or Continue with Google, once configured —
   it pre-fills name and email, then still asks for a phone number, because a
   dispatch app needs a reachable one)
2. **Phone** → any valid Nigerian mobile (e.g. `0803 123 4567`)
3. **OTP** → any 4 digits; it auto-submits
4. **Profile** → name, email, age (18+)
5. **Profile photo** → camera only, with a mandatory review step
6. **Liveness** → Start check → frame your face → blink → turn your head → face forward
7. **User type** → **Passenger**
8. **Home** → tap Drop-off, type `tunga` → note the **"Cached"** badge and
   *"N matches from local cache"*. Now type something absent like `lagos` → watch
   it fall through to a remote lookup.
9. Pick a vehicle — each tile shows a **real fare** for this exact route, quoted
   by the server from the active pricing rule
10. **Find a rider** → radar animation while the request is open, then live bids
    as drivers offer → choose one → the trip screen, with the driver's marker
    moving on the map

Then demonstrate the other side — **this needs a second device or a second
account**, since it is now a real request going to a real driver:

11. **Drawer → DEV: Switch to Rider** → lands in the document chain
12. Licence → National ID → vehicle type → plate → Review → Submit
13. **Pending approval** — cleared by an admin calling
    `PATCH /api/drivers/{id}/kyc/approve`. The driver gets a push notification
    and the dashboard unlocks by itself.
14. **Rider dashboard** → toggle Online (grants location, starts the heartbeat)
    → open requests nearby appear → **Offer to take it** → the passenger picks
    you → drive the trip through *Arrived → Start → Complete* → earnings update

> **The two halves are one system now.** Step 10 and step 14 are the same ride
> request seen from both ends. Running only one side shows a passenger who never
> gets a bid, or a driver with nothing to accept.

Worth showing too:

- **Dark mode**: Settings → Appearance → System / Light / Dark. Defaults to
  System, so it follows the phone. Flip the device theme with the app open and
  everything — including the Google map tiles — repaints live.
- **Resume**: force-quit mid-onboarding and reopen — it returns to the same step.
- **Anti-spoof**: hold a photo of a face to the camera on the liveness screen. It
  frames fine but never passes the blink check.
- **Reset**: Drawer → DEV → Reset demo → back to Welcome, clean.

---

## How it's built

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19.2, TypeScript strict |
| Liveness | `react-native-vision-camera` 5.1.1 + `react-native-vision-camera-face-detector` 2.0.6 (ML Kit) |
| Photo capture | `expo-camera` (camera-only — no gallery picker anywhere) |
| Map | `react-native-maps` 1.27.2 |
| Auth | `@react-native-google-signin/google-signin` 16.1.2 + mocked OTP |
| State | Zustand + AsyncStorage persistence |
| Navigation | React Navigation 7 — stack for onboarding, drawer post-login |

### Layout

```
src/
├── liveness/     Pure FSM — no React, no camera, fully unit-tested
├── hooks/        useLivenessCheck binds the FSM to the camera
├── store/        appStore (persisted) · bookingStore (ephemeral) · devActions
├── navigation/   Declarative root switch driven entirely by store state
├── services/     googleAuth · firebaseAuth (JS SDK) · pushNotifications (native FCM)
│                 · rideSocket (one Socket.IO connection for the whole app)
├── modules/      One API controller + types per backend resource
├── theme/        Light + dark palettes, ThemeProvider, makeStyles
├── components/   ui · camera · liveness · booking · drawer
├── screens/      auth · onboarding · rider · passenger · common
└── data/         Vehicle presentation, all user-facing copy
```

### Theming

`StyleSheet.create` snapshots colour values at module load, so a static
stylesheet can never react to a theme change. `makeStyles` keeps the familiar
"styles at the bottom of the file" shape while resolving colours at render, and
memoises per palette:

```ts
const useStyles = makeStyles(({ colors, type }) => ({
  card: { backgroundColor: colors.surface },
  title: type.heading,
}));
```

The green ramp in `theme/colors.ts` is sampled from the official Aiko brand
assets rather than picked by eye — `#0D8A41` primary, `#1FB74B` accent,
`#01311D` deep. Brand green is lifted one step in dark mode, since `#0D8A41` on
a near-black surface fails contrast for text.

The camera and liveness screens deliberately stay dark in both schemes: they're
full-bleed camera surfaces where a light chrome would be wrong.

### Three decisions worth knowing

**The liveness machine is a pure reducer.** `src/liveness/machine.ts` takes
`(state, tick, signals)` and returns new state — no React, no timers, no I/O.
That is what makes the 30 tests in `src/liveness/__tests__` possible without a
camera, and it means threshold tuning never touches logic. Every tunable number
lives in `src/liveness/constants.ts`; the machine contains no numeric literals.

**Detection runs at camera framerate; the FSM runs at 10 Hz.** The detector
callback only copies scalars into a ref (see the warning in `faceSnapshot.ts` —
the `Face` object is native-backed and cannot be stored). A fixed interval then
drives the reducer, and React state is committed only when a compact UI key
changes: roughly 6–12 renders per session instead of ~900.

**The ride flow holds no state of its own.** Booking, matching, bidding and the
trip itself are server records read through react-query; `bookingStore` keeps
only what has not been sent yet (pickup, drop-off, vehicle) plus the id of the
open request. Two delivery paths run at once and converge on the same cache —
the socket pushes each change as it happens, and a slow poll covers a socket
that dropped. Nothing is simulated: there is no client-side fare arithmetic, no
fake matching delay, and no invented driver.

**Navigation is derived, never imperative.** `RootNavigator` picks a branch from
store state, and `resolveOnboardingRoute` finds the resume point by inspecting
*data presence* rather than a stored step counter — which would go stale the
moment someone switches role or re-captures a photo. Logging out and resetting
the demo therefore need no navigation code at all.

---

## Demo-only escape hatches

All gated on `__DEV__` via `src/config/featureFlags.ts`, and all must be removed
before anything resembling a real release:

- **Skip liveness** — button on the liveness screen, plus a five-tap gesture on
  the title. Harsh backlight or a projector-lit room can defeat the eye
  classifier, and a demo that dead-ends at identity verification is a bad demo.
- **Switch role**, **Simulate admin approval**, **Reset demo** — drawer and
  Settings. Note that *Simulate admin approval* now only flips the **local**
  flag; the rider dashboard reads `kycStatus` from `GET /api/drivers/me`, so a
  real approval still has to come from the API.
- **Debug overlay** — live yaw/roll/pitch and eye probabilities over the camera.
  This is the calibration instrument: use it to confirm eye probabilities arrive,
  and to read real ranges before tuning `EYE_LOW` / `EYE_HIGH`.

## Tuning liveness on real hardware

Open the liveness screen with the debug overlay visible and check three things
in office light, bright outdoor light, and dim light:

1. Eye probabilities are non-null (proves `runClassifications` is wired).
2. `yaw` changes sign predictably as you turn your head. The check ships
   **direction-agnostic** (`ENFORCE_TURN_DIRECTION: false`) because ML Kit's yaw
   handedness varies by device — see the comment in `constants.ts` for how to
   enable a named direction.
3. The eye value actually crosses `EYE_LOW` on a natural blink. If it doesn't,
   raise `EYE_LOW` — and note that lowering `EMA_ALPHA` will make this *worse*,
   not better, by smoothing the dip away.

## Known constraints

- **Android only.** Built on Windows; iOS config keys are present but untested.
- **Physical device required** for liveness.
- **No data leaves the device.** Photos are copied into the app's document
  directory (not the evictable cache) and never uploaded. The Google ID token is
  deliberately *not* persisted — there's no backend to exchange it with, and
  storing an unusable credential is pure liability.
- **Google Sign-In needs provisioning** before it works — see above.

## Native build notes

Two things here are load-bearing and easy to break:

- **`kotlinVersion: '2.2.21'`** in `app.config.ts`. Modules in this graph declare
  different Kotlin fallbacks (the face detector 2.3.0, VisionCamera 2.2.21, Nitro
  2.1.x) and the root wins, so it has to be pinned once. 2.2.21 is the highest
  entry in Expo's `KSPLookup` table (`expo-modules-autolinking`) — i.e. the
  newest Kotlin Expo has a tested KSP pairing for. Raising it to 2.3.0 falls off
  that table and crashes `react-native-safe-area-context`'s Kotlin compile with
  an internal compiler error. Check `KSPLookup.kt` before changing it.
- **`experiments.tsconfigPaths: true`**. This is what lets Metro resolve the
  `@/*` alias. Without it every `@/…` import fails at runtime while `tsc` stays
  perfectly happy.

A first clean build takes ~40 minutes (NDK/C++ across four ABIs). For a physical
device you can cut that roughly 4× by building one architecture:

```bash
cd android && ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

### If the build fails with "Failed to create MD5 hash for … libreanimated.so"

Stale intermediates, not a code problem. `expo prebuild --clean` wipes `android/`
but **not** `node_modules/*/android/build`, so changing
`-PreactNativeArchitectures` between runs leaves each native module's Gradle
cache pointing at `.so` files for architectures you're no longer building:

```bash
find node_modules -maxdepth 3 -type d -path "*/android/build" -exec rm -rf {} +
rm -rf android/app/build android/build
```

Then build again. Worth knowing before you spend 20 minutes reading a stack
trace that looks like a Reanimated bug.
