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

    this._initialPos = null;
    this._coolingStartTime = null;
  }

  handleLeapFrame(frame) {
    const hand1 = frame.hands[0];
    const hand2 = frame.hands[1];
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
    if (frame.hands.length === 1 && closedHands === 1) {
      let cooling;
      let vel = hand1.palmVelocity;
      let xyVelocity = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1]);
      if (xyVelocity < this.config.coolingVelocity) {
        if (!this._coolingStartTime) this._coolingStartTime = Date.now();
        if (Date.now() - this._coolingStartTime > this.config.coolingReqTime) {
          cooling = true;
        }
      } else {
        cooling = false;
        this._coolingStartTime = null;
      }
      if (!this._initialPos) {
        this._initialPos = hand1.palmPosition;
      }
      this.callbacks.gestureDetected({
        xDiff: hand1.palmPosition[0] - this._initialPos[0],
        yDiff: hand1.palmPosition[1] - this._initialPos[1],
        cooling
      });
    } else {
      this._initialPos = null;
      this._coolingStartTime = null;
    }
  }
}
