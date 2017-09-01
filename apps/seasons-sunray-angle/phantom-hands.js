import angleLeft from './phantom-hands/angle-left.json';
import angleRight from './phantom-hands/angle-right.json';
import rotateLeft from '../common/phantom-hands/rotate-left.json';
import rotateRight from '../common/phantom-hands/rotate-right.json';
import orbitLeft from './phantom-hands/orbit-left.json';
import orbitRight from './phantom-hands/orbit-right.json';

const flatHandLeft = [rotateLeft[rotateLeft.length - 1]];
const flatHandRight = [rotateRight[rotateRight.length - 1]];

const orbitRotateLeft = [orbitLeft[orbitLeft.length - 1]];
const orbitRotateRight = [orbitRight[orbitRight.length - 1]];

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

  orbitLeft: {
    hands: [
      {
        frames: orbitLeft,
        follow: {
          xOffset: [-100, 50],
          yOffset: -150
        }
      }
    ],
    interval: 200
  },

  orbitRight: {
    hands: [
      {
        frames: orbitRight,
        follow: {
          xOffset: [100, -50],
          yOffset: -150
        }
      }
    ],
    interval: 200
  },

  orbitRotateLeft: {
    hands: [
      {
        frames: orbitRotateLeft,
        animatedFollow: {
          duration: 2000,
          xOffset: [-100, 50],
          yOffset: -150
        }
      }
    ],
    interval: 220
  },

  orbitRotateRight: {
    hands: [
      {
        frames: orbitRotateRight,
        animatedFollow: {
          duration: 2000,
          xOffset: [100, -50],
          yOffset: -150
        }
      }
    ],
    interval: 220
  }
};

export default phantomHands;
