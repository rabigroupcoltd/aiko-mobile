module.exports = function (api) {
  api.cache(true);
  return {
    // No `react-native-reanimated/plugin` entry on purpose. On SDK 57 that shim
    // just re-exports `react-native-worklets/plugin`, which babel-preset-expo
    // already adds by itself whenever the package is installed — listing it here
    // applies the same plugin twice. The Expo 57 docs are explicit: "No
    // additional configuration is required."
    presets: ['babel-preset-expo'],
  };
};
