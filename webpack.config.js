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
    'lab-heat-transfer-two-hands': './apps/lab-heat-transfer-two-hands/main.jsx',
    'lab-heat-transfer-micro': './apps/lab-heat-transfer-micro/main.jsx',
    'lab-heat-transfer-micro-direct': './apps/lab-heat-transfer-micro-direct/main.jsx',
    'lab-heat-transfer-micro-two-atoms': './apps/lab-heat-transfer-micro-two-atoms/main.jsx',
    'lab-heat-transfer-long': './apps/lab-heat-transfer-long/main.jsx',
    'lab-add-rm-atom-test': './apps/lab-add-rm-atom-test/main.jsx',
    'lab-add-rm-atom-test-swipe': './apps/lab-add-rm-atom-test-swipe/main.jsx',
    'lab-pressure-equilibrium': './apps/lab-pressure-equilibrium/main.jsx',
    'seasons-sunray-angle': './apps/seasons-sunray-angle/main.jsx',
    'hands-view-realistic': './apps/hands-view-realistic/main.jsx',
    'hands-view-simple': './apps/hands-view-simple/main.jsx',
    'realsense-test': './apps/realsense-test/main.jsx',
    'base-app': './apps/base-app/main.jsx',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "[name].js"
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: [
        /node_modules/,
        path.resolve(__dirname, 'apps/common/js/lib')
      ], loader: 'babel-loader?optional=runtime' },
      { test: /\.css$/, exclude: /node_modules/, loader: 'style!css!autoprefixer' },
      { test: /\.less$/, exclude: /node_modules/, loader: 'style!css!less!autoprefixer' },
      { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' },
      { test: /\.(png|jpg|gif|wav|svg)$/, exclude: /node_modules/, loader: 'file-loader' }
    ]
  },
  plugins: [
    new CommonsChunkPlugin("commons.js"),
    new CopyWebpackPlugin([
      {from: 'public'},
      {from: 'node_modules/react-lab/dist/lab', to: 'lab'}
    ])
  ]
};
