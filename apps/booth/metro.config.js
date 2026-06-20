const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: resolve hoisted deps + workspace packages (avoid watching entire repo)
config.watchFolders = [
  path.resolve(workspaceRoot, "packages/shared"),
  path.resolve(workspaceRoot, "packages/theme"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

/**
 * Windows: Metro's watcher crashes on missing optional @esbuild platform
 * folders (only win32-x64 is installed locally). Skip them during crawl.
 */
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  /node_modules[\\/]@esbuild[\\/](?!win32-x64)(?:[^\\/]+)[\\/]?/,
];

module.exports = config;
