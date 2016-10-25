import React from 'react';
import introLeft from '../common/phantom-hands/intro-left.json';
import introRight from '../common/phantom-hands/intro-right.json';
import fistLeft from '../common/phantom-hands/fist-left.json';
import fistRight from '../common/phantom-hands/fist-right.json';

const closedFistLeft = [fistLeft[fistLeft.length - 1]];
const closedFistRight = [fistRight[fistRight.length - 1]];

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
  initial: intro,
  oneHand: intro,

  twoHands: {
    hands: [
      {
        frames: fistLeft,
        follow: {
          xOffset: -100
        }
      },
      {
        frames: fistRight,
        follow: {
          xOffset: 100
        }
      }
    ],
    interval: 220
  },

  sideUnclear: {
    hands: [
      {
        frames: closedFistLeft,
        animatedFollow: {
          duration: 3000,
          xOffset: [-70, 70]
        }
      },
      {
        frames: closedFistRight,
        animatedFollow: {
          duration: 3000,
          xOffset: [-70, 70]
        }
      }
    ],
    interval: 220
  },

  closedFists: {
    hands: [
      {
        frames: closedFistLeft,
        animatedFollow: {
          duration: 2000,
          xOffset: [-100, 50]
        }
      },
      {
        frames: closedFistRight,
        animatedFollow: {
          duration: 2000,
          xOffset: [100, -50]
        }
      }
    ],
    interval: 220
  }
};

export default phantomHands;
