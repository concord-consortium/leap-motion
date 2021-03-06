import angleLeft from './phantom-hands/angle-left.json';
import angleRight from './phantom-hands/angle-right.json';
import rotateLeft from '../common/phantom-hands/rotate-left.json';
import rotateRight from '../common/phantom-hands/rotate-right.json';
import orbit from './phantom-hands/orbit.json';
import orbitRotateRight from './phantom-hands/orbitRotateRight.json';
import orbitRotateLeft from './phantom-hands/orbitRotateLeft.json';

const flatHandLeft = [rotateLeft[rotateLeft.length - 1]];
const flatHandRight = [rotateRight[rotateRight.length - 1]];

const phantomHands = {
  angleLeft: {
    hands: [
      {
        frames: angleLeft,
        follow: {
          xOffset: -100,
          yOffset: -150
        }
      }
    ],
    interval: 250
  },

  angleRight: {
    hands: [
      {
        frames: angleRight,
        follow: {
          xOffset: 100,
          yOffset: -150
        }
      }
    ],
    interval: 250
  },

  handsVertical: {
    hands: [
      {
        frames: rotateLeft,
        follow: {
          xOffset: -100,
          yOffset: -150
        }
      },
      {
        frames: rotateRight,
        follow: {
          xOffset: 100,
          yOffset: -150
        }
      }
    ],
    interval: 220
  },

  handsMove: {
    hands: [
      {
        frames: flatHandLeft,
        animatedFollow: {
          duration: 2000,
          xOffset: [-100, 50],
          yOffset: -150
        }
      },
      {
        frames: flatHandRight,
        animatedFollow: {
          duration: 2000,
          xOffset: [100, -50],
          yOffset: -150
        }
      }
    ],
    interval: 220
  },

  orbit: {
    hands: [
      {
        frames: orbit,
        follow: {
          xOffset: -100,
          yOffset: -150
        }
      }
    ],
    interval: 200
  },

  orbitRotate: {
    hands: [
      {
        frames: orbitRotateRight
      }
    ],
    interval: 200
  }
};

export default phantomHands;
