var path = require('path');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'base-app': './apps/base-app/main.jsx',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "[name].js"
  },
  devServer: { inline: true },
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
