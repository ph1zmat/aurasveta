const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude native build artifacts from Metro's file watcher
// to prevent ENOENT crashes on temporary CMake/CXX files
const exclusionPatterns = [
  /android[\/\\]\.cxx[\/\\].*/,
  /android[\/\\]\.gradle[\/\\].*/,
  /android[\/\\]build[\/\\].*/,
  /node_modules[\/\\].*[\/\\]android[\/\\]\.cxx[\/\\].*/,
];

const defaultBlockList = config.resolver.blockList;
if (defaultBlockList) {
  if (Array.isArray(defaultBlockList)) {
    exclusionPatterns.unshift(...defaultBlockList);
  } else {
    exclusionPatterns.unshift(defaultBlockList);
  }
}
config.resolver.blockList = exclusionPatterns;

// Also configure the watcher to ignore these directories
config.watcher = {
  ...config.watcher,
  ignored: [
    /node_modules[\/\\].*[\/\\]android[\/\\]\.cxx[\/\\].*/,
    /android[\/\\]\.cxx[\/\\].*/,
    /android[\/\\]\.gradle[\/\\].*/,
  ],
};

module.exports = config;
