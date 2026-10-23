module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.tsx',
    '^react-native-geolocation-service$': '<rootDir>/__mocks__/react-native-geolocation-service.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((react-native|@react-native|@react-navigation|@reduxjs|immer|redux-persist|react-redux|react-native-keychain|react-native-safe-area-context|react-native-svg|lucide-react-native)/))',
  ],
  setupFiles: ['./jest.setup.js'],
};
