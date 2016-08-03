import {Howl} from 'howler';
import extend from '../common/js/tools/extend';

const DEFAULT_CONFIG = {
  closedGrabStrength: 0.7,
  coolingVelocity: 60,
  coolingReqTime: 500 // ms
};

export default class FistBump {
  constructor(config, callbacks) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    this.callbacks = callbacks;

    this._initialPos1 = null;
    this._initialPos2 = null;
    this._coolingStartTime = null;
  }

  handleLeapFrame(frame) {
    let hand1 = frame.hands[0];
    let hand2 = frame.hands[1];
    // Make sure that hand1 is always the left one.
    if (hand1 && hand1.type === 'right') {
      let tmp = hand1;
      hand1 = hand2;
      hand2 = tmp;
    }
    let closedHands = 0;
    if (hand1 && hand1.grabStrength > this.config.closedGrabStrength) {
      closedHands += 1;
    }
    if (hand2 && hand2.grabStrength > this.config.closedGrabStrength) {
      closedHands += 1;
    }
    this.callbacks.leapState({
      numberOfHands: frame.hands.length,
      numberOfClosedHands: closedHands
    });
    if (frame.hands.length === 2 && closedHands === 2) {
      let cooling;
      let vel1 = hand1.palmVelocity;
      let xyVelocity1 = Math.sqrt(vel1[0] * vel1[0] + vel1[1] * vel1[1]);
      let vel2 = hand2.palmVelocity;
      let xyVelocity2 = Math.sqrt(vel2[0] * vel2[0] + vel2[1] * vel2[1]);
      if (xyVelocity1 < this.config.coolingVelocity && xyVelocity2 < this.config.coolingVelocity) {
        if (!this._coolingStartTime) this._coolingStartTime = Date.now();
        if (Date.now() - this._coolingStartTime > this.config.coolingReqTime) {
          cooling = true;
        }
      } else {
        cooling = false;
        this._coolingStartTime = null;
      }
      if (!this._initialPos1) {
        this._initialPos1 = hand1.palmPosition;
      }
      if (!this._initialPos2) {
        this._initialPos2 = hand2.palmPosition;
      }
      this.callbacks.gestureDetected({
        xDiff1: hand1.palmPosition[0] - this._initialPos1[0],
        yDiff1: hand1.palmPosition[1] - this._initialPos1[1],
        xDiff2: hand2.palmPosition[0] - this._initialPos2[0],
        yDiff2: hand2.palmPosition[1] - this._initialPos2[1],
        cooling
      });
    } else {
      this._initialPos1 = null;
      this._initialPos2 = null;
      this._coolingStartTime = null;
    }
  }
}
