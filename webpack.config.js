var path = require('path');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'lab-temperature-test': './apps/lab-temperature-test/main.jsx',
    'lab-temperature-delta': './apps/lab-temperature-delta/main.jsx',
    'lab-temperature-absolute': './apps/lab-temperature-absolute/main.jsx',
    'lab-volume-pressure': './apps/lab-volume-pressure/main.jsx',
    'lab-heat-transfer': './apps/lab-heat-transfer/main.jsx',
    'lab-add-rm-atom-test': './apps/lab-add-rm-atom-test/main.jsx',
    'lab-add-rm-atom-test-swipe': './apps/lab-add-rm-atom-test-swipe/main.jsx',
    'lab-pressure-equilibrium': './apps/lab-pressure-equilibrium/main.jsx',
    'seasons-sunray-angle': './apps/seasons-sunray-angle/main.jsx'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "[name].js"
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader?optional=runtime' },
      { test: /\.css$/, exclude: /node_modules/, loader: 'style-loader!css-loader' },
      { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' },
      { test: /\.(png|jpg|wav)$/, exclude: /node_modules/, loader: 'file-loader' }
    ]
  },
  plugins: [
    new CommonsChunkPlugin("commons.js"),
    new CopyWebpackPlugin([
      {from: 'public'}
    ])
  ]
};
