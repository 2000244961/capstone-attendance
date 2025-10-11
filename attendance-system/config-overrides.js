const { override, addWebpackModuleRule, addBabelPreset } = require('customize-cra');

module.exports = override(
  addWebpackModuleRule({
    test: /\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    exclude: /node_modules\/(?!face-api.js)/,  // Ignore source map warnings for face-api.js
  }),
  addBabelPreset('@babel/preset-react'),
  addBabelPreset('@babel/preset-env')
);
