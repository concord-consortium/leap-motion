var path = require('path');
module.exports = {
  entry: {
    'lab-temperature-test': './js/gestures/lab-temperature-test.jsx'
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
  }
};
