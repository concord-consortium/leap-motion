import React from 'react';
import PhantomHandsBase from '../common/js/components/phantom-hands-base.jsx';
import rotateLeft from '../common/phantom-hands/rotate-left.json';
import introLeft from '../common/phantom-hands/intro-left.json';
import introRight from '../common/phantom-hands/intro-right.json';
import fistRight from '../common/phantom-hands/fist-right.json';

const closedFist = [fistRight[fistRight.length - 1]];

export default class PhantomHands extends PhantomHandsBase {
  startAnimation(hint) {
    switch(hint) {
      case 'noHands': return this.renderIntro();
      case 'handMissing': return this.renderIntro();
      case 'rotate': return this.renderPlungerHand();
      case 'fist': return this.renderFistHand();
      case 'tap': return this.renderTappingHand();
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

  renderPlungerHand() {
    this.animateHands({
      hands: [
        {
          frames: rotateLeft,
          follow: {
            xOffset: -70
          }
        }
      ],
      interval: 200
    });
  }

  renderFistHand() {
    this.animateHands({
      hands: [
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

  renderTappingHand() {
    this.animateHands({
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
    });
  }
}
