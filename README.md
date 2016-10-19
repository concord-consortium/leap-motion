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

## Running project locally 

### Prerequisites

1. Open Terminal app
2. Make sure that *node* and *npm* tools are installed and up to date. Type: `node --version` and `npm --version`
3. If they are not installed or outdated (*node* version is older than 5.x), download *node* installer from [this page](https://nodejs.org/en/download/current/). *npm* will be automatically installed together with *node*.
4. [Windows only] If `npm install` fails, you might need to run terminal as Administrator and type: `npm install --global --production windows-build-tools`

### Running local server (production code)

1. Download and unzip the source code: https://github.com/concord-consortium/leap-motion/archive/production.zip
2. Open Terminal app
3. Go to the directory with downloaded code, type `cd ~/Downloads/leap-motion-production`
4. Type: `npm install` (it might take a while)
5. Type: `npm run server`
6. Open: [http://localhost:8080/index.html](http://localhost:8080/index.html)

### Running local server (latest development or topic branch code)

Follow previous instructions, but replace `production.zip` segment in the URL with `master.zip` for the latest development version or with name of the branch that you're interested in. For example:

- https://github.com/concord-consortium/leap-motion/archive/master.zip
- https://github.com/concord-consortium/leap-motion/archive/two-hands-angle.zip

## Releases

- [0.4.0 (Jun 9, 2016)](http://models-resources.concord.org/leap-motion/version/0.4.0/index.html)
- [0.3.0 (Feb 18, 2016)](http://models-resources.concord.org/leap-motion/version/0.3.0/index.html)
- [0.2.2 (Feb 17, 2016)](http://models-resources.concord.org/leap-motion/version/0.2.2/index.html)
- [0.2.0 (Feb 13, 2016)](http://models-resources.concord.org/leap-motion/version/0.2.0/index.html)
- [0.1.0 (Feb 2, 2016)](http://models-resources.concord.org/leap-motion/version/0.1.0/index.html)

## License 

[MIT](https://github.com/concord-consortium/grasp-seasons/blob/master/LICENSE)
