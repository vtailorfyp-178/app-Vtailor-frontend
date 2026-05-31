const http = require('http');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const API_PROXY_TARGET = { hostname: '127.0.0.1', port: 8000 };
const MODELS_PROXY_TARGET = { hostname: '127.0.0.1', port: 3001 };

function shouldProxyToModelsApi(urlPath) {
  return (
    urlPath === '/health' ||
    urlPath === '/models' ||
    urlPath.startsWith('/models/') ||
    urlPath === '/fabric-prints' ||
    urlPath.startsWith('/fabric-prints/')
  );
}

function shouldProxyToBackend(urlPath) {
  return urlPath === '/health' || urlPath.startsWith('/app/api') || urlPath.startsWith('/3dModels');
}

function proxyRequestToBackend(req, res) {
  const proxyReq = http.request(
    {
      ...API_PROXY_TARGET,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${API_PROXY_TARGET.hostname}:${API_PROXY_TARGET.port}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          detail: 'Backend not reachable on 127.0.0.1:8000. Run: cd app-Vtailor && .\\start-api.ps1',
        }),
      );
    }
  });
  req.pipe(proxyReq);
}

function proxyRequestToModelsApi(req, res) {
  const proxyReq = http.request(
    {
      ...MODELS_PROXY_TARGET,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${MODELS_PROXY_TARGET.hostname}:${MODELS_PROXY_TARGET.port}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          detail: 'Models API not reachable on 127.0.0.1:3001. Run: cd app-Vtailor/models-service && npm start',
        }),
      );
    }
  });
  req.pipe(proxyReq);
}

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const threeRoot = path.resolve(projectRoot, 'node_modules/three');

/** Node-only GLB tools — must never ship in the React Native bundle. */
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /node_modules[\\/]draco3dgltf[\\/].*/,
  /node_modules[\\/]@gltf-transform[\\/].*/,
];

if (!config.resolver.assetExts.includes('glb')) {
  config.resolver.assetExts.push('glb');
}
if (!config.resolver.assetExts.includes('gltf')) {
  config.resolver.assetExts.push('gltf');
}

/** Prefer CJS over ESM in node_modules (avoids untransformed import.meta on web). */
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native', 'default'];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  three: threeRoot,
  zustand: path.resolve(projectRoot, 'node_modules/zustand/index.js'),
  'zustand/middleware': path.resolve(projectRoot, 'node_modules/zustand/middleware.js'),
  'zustand/shallow': path.resolve(projectRoot, 'node_modules/zustand/shallow.js'),
  'zustand/vanilla': path.resolve(projectRoot, 'node_modules/zustand/vanilla.js'),
  'zustand/traditional': path.resolve(projectRoot, 'node_modules/zustand/traditional.js'),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return {
      filePath: path.join(threeRoot, 'build/three.cjs'),
      type: 'sourceFile',
    };
  }

  if (
    typeof moduleName === 'string' &&
    (moduleName.startsWith('three/examples/jsm/') ||
      moduleName.startsWith('three/examples\\jsm\\'))
  ) {
    const normalized = moduleName.replace(/\\/g, '/');
    const filePath = path.resolve(projectRoot, 'node_modules', normalized);
    return { filePath, type: 'sourceFile' };
  }
  if (typeof moduleName === 'string' && moduleName.startsWith('three/addons/')) {
    const suffix = moduleName.slice('three/addons/'.length);
    const filePath = path.resolve(projectRoot, 'node_modules/three/examples/jsm', suffix);
    return { filePath, type: 'sourceFile' };
  }

  if (platform === 'web' && typeof moduleName === 'string') {
    if (moduleName === '@react-three/fiber/native' || moduleName.endsWith('/fiber/native')) {
      return context.resolveRequest(context, '@react-three/fiber', platform);
    }
    if (moduleName === '@react-three/drei/native' || moduleName.endsWith('/drei/native')) {
      return context.resolveRequest(context, '@react-three/drei', platform);
    }
    if (moduleName === '@react-three/fiber') {
      return {
        filePath: path.resolve(
          projectRoot,
          'node_modules/@react-three/fiber/dist/react-three-fiber.cjs.js',
        ),
        type: 'sourceFile',
      };
    }
    if (moduleName === '@react-three/drei') {
      return {
        filePath: path.resolve(projectRoot, 'node_modules/@react-three/drei/index.cjs.js'),
        type: 'sourceFile',
      };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Phone can reach Metro (8081) but Windows often blocks port 8000. Proxy API via Metro → localhost:8000.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    const urlPath = (req.url || '').split('?')[0];
    if (shouldProxyToModelsApi(urlPath)) {
      proxyRequestToModelsApi(req, res);
      return;
    }
    if (shouldProxyToBackend(urlPath)) {
      proxyRequestToBackend(req, res);
      return;
    }
    return middleware(req, res, next);
  },
};

module.exports = config;
