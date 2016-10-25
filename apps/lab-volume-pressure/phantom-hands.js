import rotateLeft from '../common/phantom-hands/rotate-left.json';
import introLeft from '../common/phantom-hands/intro-left.json';
import introRight from '../common/phantom-hands/intro-right.json';
import fistRight from '../common/phantom-hands/fist-right.json';

const closedFist = [fistRight[fistRight.length - 1]];

const intro = {
  hands: [
    {
      frames: introLeft
    },
    {
      frames: introRight
    }
  ],
  interval: 250
};

const phantomHands = {
  noHands: intro,
  handMissing: intro,

  rotate: {
    hands: [
      {
        frames: rotateLeft,
        follow: {
          xOffset: -70
        }
      }
    ],
    interval: 200
  },

  fist: {
    hands: [
      {
        frames: fistRight,
        follow: {
          xOffset: 100
        }
      }
    ],
    interval: 220
  },

  tap: {
    hands: [
      {
        frames: closedFist,
        animatedFollow: {
          duration: 1600,
          xOffset: [0, -150]
        }
      }
    ],
    interval: 200
  }
};

export default phantomHands;
