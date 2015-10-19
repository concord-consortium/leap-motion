# leap-motion

Experiments related to the gesture detection.

####Lab
- http://concord-consortium.github.io/leap-motion/examples/lab-temperature-absolute.html
- http://concord-consortium.github.io/leap-motion/examples/lab-pressure-equilibrium.html
- http://concord-consortium.github.io/leap-motion/examples/lab-volume-pressure.html
- http://concord-consortium.github.io/leap-motion/examples/lab-heat-transfer.html

####Seasons
- http://concord-consortium.github.io/leap-motion/examples/seasons-sunray-angle.html

####Tests
- http://concord-consortium.github.io/leap-motion/examples/lab-temperature-test.html
- http://concord-consortium.github.io/leap-motion/examples/lab-temperature-delta.html
- http://concord-consortium.github.io/leap-motion/examples/lab-add-rm-atom-test.html
- http://concord-consortium.github.io/leap-motion/examples/lab-add-rm-atom-test-swipe.html

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
