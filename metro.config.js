const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const webMockDir = path.resolve(__dirname, 'src/mocks');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return {
        filePath: path.join(webMockDir, 'react-native-maps.web.tsx'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'react-native-google-places-autocomplete') {
      return {
        filePath: path.join(webMockDir, 'react-native-google-places-autocomplete.web.tsx'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
