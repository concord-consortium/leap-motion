# leap-motion

Experiments related to the gesture detection.

- http://concord-consortium.github.io/leap-motion/examples/lab-temperature-test.html
- http://concord-consortium.github.io/leap-motion/examples/lab-temperature-delta.html
- http://concord-consortium.github.io/leap-motion/examples/lab-temperature-absolute.html

## Development

This project is using [webpack](http://webpack.github.io/) to build the final JS file in `/dist` folder.

First, you need to make sure that webpack is installed and all the NPM packages required by this project are available:

```
npm install -g webpack
npm install
```
Then you can build JavaScript files using:
```
webpack
```
or:
```
webpack --watch
```

## License 

[MIT](https://github.com/concord-consortium/grasp-seasons/blob/master/LICENSE)
