const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...config.resolver.blockList,
  /[\\/]android[\\/](?:app[\\/])?build(?:[\\/]|$)/,
  /[\\/]\.gradle(?:[\\/]|$)/,
  /[\\/]\.cxx(?:[\\/]|$)/,
  /[\\/]ios[\\/](?:Pods|build)(?:[\\/]|$)/,
];

module.exports = config;
