const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Thêm các resolver cho lodash
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'lodash': require.resolve('lodash-es'),
};

module.exports = config; 