const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  blockList: exclusionList([
    /apps\/api\/.*/,
    /.*\.(mp4|mov|mkv|zip|psd|7z|rar)$/i,
    /logs\/.*/,
  ]),
};

// Configure Metro to use specific host if needed
// This helps when running in WSL2 with hotspot
config.server = {
  ...config.server,
  // Enable all interfaces
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

module.exports = config;