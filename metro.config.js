const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// For Metro 0.83+, use blockList directly as an array
// All patterns must have the same flags (case-insensitive 'i' flag)
config.resolver = {
  ...config.resolver,
  blockList: [
    /apps\/api\/.*/i,
    /.*\.(mp4|mov|mkv|zip|psd|7z|rar)$/i,
    /logs\/.*/i,
  ],
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

// Workaround for metro-core canonicalize export issue
// Prevents error: Package subpath './src/canonicalize' is not defined
const originalResolve = config.resolver.resolve;
config.resolver.resolve = function(context, moduleName, platform) {
  // If trying to resolve metro-core/src/canonicalize, use main export instead
  if (moduleName && typeof moduleName === 'string' && moduleName.includes('metro-core/src/canonicalize')) {
    // Redirect to metro-core main export
    return originalResolve.call(this, context, 'metro-core', platform);
  }
  return originalResolve.call(this, context, moduleName, platform);
};

module.exports = config;