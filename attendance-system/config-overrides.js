
const { override, addWebpackModuleRule, addBabelPresets } = require('customize-cra');

const addNodePolyfills = () => (config) => {
  if (!config.resolve) config.resolve = {};
  if (!config.resolve.fallback) config.resolve.fallback = {};
  config.resolve.fallback.fs = false;
  return config;
};

module.exports = override(
  addWebpackModuleRule({
    test: /face-api.js[\\/].*\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
  }),
  addBabelPresets('@babel/preset-react', '@babel/preset-env'),
  addNodePolyfills()
);
