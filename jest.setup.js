/**
 * AsyncStorage is a native module with no JS implementation under Jest, so
 * anything that reaches the auth store — which is most of the API layer —
 * throws on import without this. The mock ships with the package.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
