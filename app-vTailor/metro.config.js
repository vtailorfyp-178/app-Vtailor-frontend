const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('glb')) {
  config.resolver.assetExts.push('glb');
}
if (!config.resolver.assetExts.includes('gltf')) {
  config.resolver.assetExts.push('gltf');
}

/** Metro ignores three's package "exports"; map addon paths to real files under node_modules. */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    typeof moduleName === 'string' &&
    (moduleName.startsWith('three/examples/jsm/') ||
      moduleName.startsWith('three/examples\\jsm\\'))
  ) {
    const normalized = moduleName.replace(/\\/g, '/');
    const filePath = path.resolve(__dirname, 'node_modules', normalized);
    return { filePath, type: 'sourceFile' };
  }
  if (typeof moduleName === 'string' && moduleName.startsWith('three/addons/')) {
    const suffix = moduleName.slice('three/addons/'.length);
    const filePath = path.resolve(__dirname, 'node_modules/three/examples/jsm', suffix);
    return { filePath, type: 'sourceFile' };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
