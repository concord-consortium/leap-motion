/* eslint-disable no-undef */
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'base-app': './apps/base-app/main.jsx',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  devServer: { inline: true },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [ /node_modules/, path.resolve(__dirname, 'apps/common/js/lib')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [{
          loader: 'css-loader' // translates CSS into CommonJS
        }]
      },
      {
        test: /\.less$/,
        use: [{
          loader: 'style-loader' // creates style nodes from JS strings
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }, {
          loader: 'less-loader' // compiles Less to CSS
        }]
      },
      {
        test: /\.(png|jpg|gif|wav|svg)$/,
        use: {
          loader: 'file-loader'
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'public' },
      { from: 'node_modules/react-lab/dist/lab', to: 'lab' }
    ])
  ]
};
