import React from 'react';
import PhantomHandsBase from '../common/js/components/phantom-hands-base.jsx';
import angleLeft from './phantom-hands/angle-left.json';
import angleRight from './phantom-hands/angle-right.json';
import rotateLeft from '../common/phantom-hands/rotate-left.json';
import rotateRight from '../common/phantom-hands/rotate-right.json';

const flatHandLeft = [rotateLeft[rotateLeft.length - 1]];
const flatHandRight = [rotateRight[rotateRight.length - 1]];

export default class PhantomHands extends PhantomHandsBase {
  startAnimation(hint) {
    switch(hint) {
      case 'angleLeft': return this.renderAngleLeft();
      case 'angleRight': return this.renderAngleRight();
      case 'handsVertical': return this.renderHandsVertical();
      case 'handsMove': return this.renderHandsMove();
    }
  }

  renderAngleLeft() {
    this.animateHands({
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
    });
  }

  renderAngleRight() {
    this.animateHands({
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
    });
  }

  renderHandsVertical() {
    this.animateHands({
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
    });
  }

  renderHandsMove() {
    this.animateHands({
      hands: [
        {
          frames: flatHandLeft,
          animatedFollow: {
            duration: 2000,
            xOffset: [-100, 40],
            yOffset: -150
          }
        },
        {
          frames: flatHandRight,
          animatedFollow: {
            duration: 2000,
            xOffset: [100, -40],
            yOffset: -150
          }
        }
      ],
      interval: 220
    });
  }
}
