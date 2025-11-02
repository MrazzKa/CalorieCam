const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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