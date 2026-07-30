// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Keep Android/iOS native build output out of Metro's file map.
 *
 * Gradle and CMake write their output *inside* each native module's own package
 * — `node_modules/<pkg>/android/build` and `.../android/.cxx` — so after a few
 * `expo run:android` builds this graph carries ~8 GB / 10k extra directories
 * that Metro has no reason to look at.
 *
 * That matters on Windows specifically. `NativeWatcher` (one recursive OS-level
 * watch) is macOS-only, so Windows falls back to `FallbackWatcher`, which stats
 * every entry via `walker` and opens an `fs.watch` handle per directory. Left
 * unfiltered that takes ~87s here, and it has to finish inside metro-file-map's
 * 240s `MAX_WAIT_TIME` while competing with the crawler and the transformer
 * workers. Blowing that budget throws "Failed to start watch mode", which
 * leaves DependencyGraph uninitialised — every bundle request then 500s with
 * "Cannot read properties of undefined (reading 'get')" and the app hangs
 * forever on the native splash screen with no red box to explain why.
 *
 * `resolver.blockList` is the right knob: metro passes it to metro-file-map as
 * `ignorePattern`, which becomes both the crawler's ignore and the watcher's
 * `ignored` — and `FallbackWatcher` uses the latter to skip recursion entirely
 * rather than just filtering events. Excluding these paths cuts setup to ~38s.
 *
 * Every pattern is scoped under `android/` or `ios/` on purpose: a bare
 * `build/` rule would also block `node_modules/@expo/metro-file-map/build`,
 * i.e. published JS that Metro genuinely has to resolve.
 */
config.resolver.blockList = [
  ...config.resolver.blockList,
  // Gradle output, in the project and in every autolinked native module.
  /[\\/]android[\\/](?:app[\\/])?build(?:[\\/]|$)/,
  /[\\/]\.gradle(?:[\\/]|$)/,
  // CMake/NDK intermediates for the C++ modules (VisionCamera, Nitro, worklets).
  /[\\/]\.cxx(?:[\\/]|$)/,
  // Same idea for iOS, for whenever this is built on a Mac.
  /[\\/]ios[\\/](?:Pods|build)(?:[\\/]|$)/,
];

module.exports = config;
