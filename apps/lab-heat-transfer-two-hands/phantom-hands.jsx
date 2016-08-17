import React from 'react';
import PhantomHandsBase from '../common/js/components/phantom-hands-base.jsx';
import introLeft from '../common/phantom-hands/intro-left.json';
import introRight from '../common/phantom-hands/intro-right.json';
import fistLeft from '../common/phantom-hands/fist-left.json';
import fistRight from '../common/phantom-hands/fist-right.json';

const closedFistLeft = [fistLeft[fistLeft.length - 1]];
const closedFistRight = [fistRight[fistRight.length - 1]];

export default class PhantomHands extends PhantomHandsBase {
  startAnimation(hint) {
    switch(hint) {
      case 'initial': return this.renderIntro();
      case 'oneHand': return this.renderIntro();
      case 'twoHands': return this.renderCloseFists();
      case 'sideUnclear': return this.renderMoveToSide();
      case 'closedFists': return this.renderShaking();
    }
  }

  renderIntro() {
    this.animateHands({
      hands: [
        {
          frames: introLeft
        },
        {
          frames: introRight
        }
      ],
      interval: 250
    });
  }

  renderCloseFists() {
    this.animateHands({
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
    });
  }

  renderMoveToSide() {
    this.animateHands({
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
    });
  }
  
  renderShaking() {
    this.animateHands({
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
    });
  }
}
