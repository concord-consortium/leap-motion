import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import {addPhantomHand, followRealHand, setupPhantomHand, removePhantomHand} from '../tools/leap-phantom-hand';

// Accepts range (array), animation duration, interval and the current frame number.
// Returns value within provided range.
// Note that it's cyclic interpolation, so e.g. [0, 100] range would be interpolated like:
// 0, 10, 20, .., 80, 90, 100, 90, 80, ..., 20, 10, 0, 10, 20, ...
function interpolate(range, duration, interval, frame) {
  const steps = duration / interval;
  let progress = 2 * (frame % steps) / steps;
  if (progress > 1) {
    progress = 2 - progress;
  }
  const start = range[0];
  const end = range[1];
  return start + progress * (end - start);
}

// This component doesn't render anything directly. It's meant to be used together with HandsViewRealistic.
// It adds phantom hands directly to its view (since Leap Controller and its plugins are globally available).
// It should be subclassed.
// #startAnimation can be overwritten to respond to different hint names.
// #animateHands method handles most of the uses cases. It accepts hash. Look at existing subclasses to see it works.
// Some examples:
// 1. Renders hands and uses provided animation frames (frames are switched every X ms):
// {
//   hands: [
//     {
//       frames: closedFistLeft
//     },
//     {
//       frames: closedFistRight
//     }
//   ],
//   interval: 200
// }
// 2. Same as above, but hands follow real user hands:
// {
//   hands: [
//     {
//       frames: closedFistLeft,
//       follow: {xOffset: -100}
//     },
//     {
//       frames: closedFistRight,
//       follow: {xOffset: 100}
//     }
//   ],
//   interval: 200
// }
// 2. Same as above, but hands follow real user hands and offset is additionally animated:
// {
//   hands: [
//     {
//       frames: closedFistLeft,
//       animatedFollow: {xOffset: [-100, 100], duration: 2000}
//     },
//     {
//       frames: closedFistRight,
//       animatedFollow: {xOffset: [100, -100], duration: 2000}
//     }
//   ],
//   interval: 200
// }
export default class PhantomHandsBase extends React.Component {
  componentDidUpdate(prevProps) {
    const oldHint = prevProps.hint;
    const newHint = this.props.hint;
    if (oldHint !== newHint) {
      this.cleanupPhantomHands();
      this.startAnimation(newHint);
    }
  }

  startAnimation(hintName) {
    // Overwrite and implement, e.g.:
    // switch(hintName) {
    //   case 'initial': return this.animIntro();
    //   case 'oneHand': return this.animRotateHand();
    //   (...)
    // }
  }

  // The most important helper method.
  animateHands(options) {
    this.phantomHands = [];
    this.frameId = 0;
    const hands = options.hands;
    hands.forEach(hand => {
      const mesh = addPhantomHand(hand.frames[0]);
      this.phantomHands.push(mesh);
      // If 'follow' is defined, it means that hand should follow real hand. This hash has options such as
      // offset in X/Y/Z axis (so phantom hand doesn't overlap real hand).
      if (hand.follow) {
        followRealHand(mesh, hand.follow);
      }
    });
    this.setupAnimation((frame) => {
      hands.forEach((hand, idx) => {
        if (hand.frames.length > 1) setupPhantomHand(this.phantomHands[idx], hand.frames[frame % hand.frames.length]);
        if (hand.animatedFollow) {
          const animOpts = hand.animatedFollow;
          const offsets = {
            xOffset: animOpts.xOffset && animOpts.xOffset.length > 1 ? interpolate(animOpts.xOffset, animOpts.duration, options.interval, frame) : 0,
            yOffset: animOpts.yOffset && animOpts.yOffset.length > 1 ? interpolate(animOpts.yOffset, animOpts.duration, options.interval, frame) : 0,
            zOffset: animOpts.zOffset && animOpts.zOffset.length > 1 ? interpolate(animOpts.zOffset, animOpts.duration, options.interval, frame) : 0
          };
          followRealHand(this.phantomHands[idx], offsets);
        }
      });
    }, options.interval);
  }

  // Other helpers, mostly used internally:
  setupAnimation(callback, interval) {
    this.frameId = 0;
    this.animInterval = setInterval(() => {
      callback(this.frameId);
      this.frameId += 1;
    }, interval);
  }

  cleanupPhantomHands() {
    while (this.phantomHands && this.phantomHands.length > 0) {
      removePhantomHand(this.phantomHands.pop());
    }
    if (this.animInterval) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
  }

  render() {
    return null;
  }
}

reactMixin.onClass(PhantomHandsBase, pureRender);
