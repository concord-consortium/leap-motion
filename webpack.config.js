var path = require('path');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
module.exports = {
  entry: {
    'lab-temperature-test': './js/pages/lab-temperature-test.jsx',
    'lab-temperature-delta': './js/pages/lab-temperature-delta.jsx',
    'lab-temperature-absolute': './js/pages/lab-temperature-absolute.jsx',
    'lab-add-rm-atom-test': './js/pages/lab-add-rm-atom-test.jsx',
    'lab-add-rm-atom-test-swipe': './js/pages/lab-add-rm-atom-test-swipe.jsx',
    'lab-pressure-equilibrium': './js/pages/lab-pressure-equilibrium.jsx'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "[name].js"
  },
  module: {
    loaders: [
      {
        test: path.join(__dirname, 'js'),
        loader: 'babel-loader?optional=runtime'
      },
      {
        test: path.join(__dirname, 'css'),
        loader: 'style-loader!css-loader'
      }
    ]
  },
  plugins: [
    new CommonsChunkPlugin("commons.js")
  ]
};
