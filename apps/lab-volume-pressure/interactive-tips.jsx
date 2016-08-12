import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import rotate from './phantom-hands/rotate.json';
import introLeft from './phantom-hands/intro-left.json';
import introRight from './phantom-hands/intro-right.json';
import fist from './phantom-hands/fist.json';
import bump from './phantom-hands/bump.json';
import {addPhantomHand, followRealHand, setupPhantomHand, removePhantomHand} from '../common/js/tools/leap-phantom-hand';
import './interactive-tips.less';

// This component doesn't render anything directly. It's meant to be used together with HandsViewRealistic.
// It adds phantom hands directly to its view (since Leap Controller and its plugins are globally available).
export default class InteractiveTips extends React.Component {
  componentDidUpdate(prevProps) {
    const oldHint = prevProps.hint;
    const newHint = this.props.hint;
    if (oldHint !== newHint) {
      this.cleanupPhantomHand();
      switch(newHint) {
        case 'noHands': return this.renderIntro();
        case 'handMissing': return this.renderIntro();
        case 'rotate': return this.renderPlungerHand();
        case 'fist': return this.renderFistHand();
        case 'tap': return this.renderTappingHand();
      }
    }
  }

  setupAnimation(callback, interval) {
    this.frameId = 0;
    this.animInterval = setInterval(() => {
      callback(this.frameId);
      this.frameId += 1;
    }, interval);
  }

  cleanupPhantomHand() {
    while (this.phantomHands && this.phantomHands.length > 0) {
      removePhantomHand(this.phantomHands.pop());
    }
    if (this.animInterval) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
  }

  renderIntro() {
    this.phantomHands = [addPhantomHand(introLeft[0]), addPhantomHand(introRight[0])];
    this.setupAnimation((frame) => {
      setupPhantomHand(this.phantomHands[0], introLeft[frame % introLeft.length]);
      setupPhantomHand(this.phantomHands[1], introRight[frame % introRight.length]);
    }, 250);
  }


  renderPlungerHand() {
    this.phantomHands = [addPhantomHand(rotate[0])];
    followRealHand(this.phantomHands[0], {xOffset: -70});
    this.setupAnimation((frame) => {
      setupPhantomHand(this.phantomHands[0], rotate[frame % rotate.length]);
    }, 200);
  }

  renderFistHand() {
    this.phantomHands = [addPhantomHand(fist[0])];
    followRealHand(this.phantomHands[0], {xOffset: 100});
    this.setupAnimation((frame) => {
      setupPhantomHand(this.phantomHands[0], fist[frame % fist.length]);
    }, 220);
  }

  renderTappingHand() {
    this.phantomHands = [addPhantomHand(bump[0])];
    followRealHand(this.phantomHands[0], {xOffset: 0});
    const steps = 12;
    this.setupAnimation((frame) => {
      let mult = frame % steps;
      if (mult > steps * 0.5) mult = steps - mult;
      followRealHand(this.phantomHands[0], {xOffset: (mult / steps) * -300});
    }, 120);
  }

  render() {
    return null;
  }
}

reactMixin.onClass(InteractiveTips, pureRender);
