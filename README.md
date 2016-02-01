# leap-motion

Latest **stable** version:

http://models-resources.concord.org/leap-motion/index.html

Latest **development** version:

http://models-resources.concord.org/leap-motion/branch/master/index.html

Old versions can be accesed via `/version/<tag>` path, e.g.:

http://models-resources.concord.org/leap-motion/version/0.1.0/index.html

Github Pages deployment is equal to version 0.1.0:

http://concord-consortium.github.io/leap-motion/

It won't be updated in the future.

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

## Deployment

This project is automatically deployed to S3 bucket by Travis-CI.

- `production` branch is deployed to top-level directory (http://models-resources.concord.org/leap-motion/index.html).
- other branches are deployed to `/branch/` subdirectories (e.g. http://models-resources.concord.org/leap-motion/branch/master/index.html)
- tags are deployed to `/version/` subdirectories  (e.g. http://models-resources.concord.org/leap-motion/version/0.1.0/index.html)

## License 

[MIT](https://github.com/concord-consortium/grasp-seasons/blob/master/LICENSE)
