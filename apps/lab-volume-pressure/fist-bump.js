import {Howl} from 'howler';
import avg from '../common/js/tools/avg';
import DirectionChange from '../common/js/tools/direction-change';
import extend from '../common/js/tools/extend';
import tapSound from '../common/sounds/tap.wav'

const DEFAULT_OPTIONS = {
  closedGrabStrength: 0.4,
  openGrabStrength: 0.7,
  handTwistTolerance: 0.7,
  minAmplitude: 20,
  maxKnockDist: 150
};

const AVAILABLE_CALLBACKS = {
  leapState: function (state) {},
  // Closed fist bumping against flat hand within knocking distance.
  gestureDetected: function (gestureState) {}
};

export default class FistBump {
  constructor(config, callbacks, plotter) {
    this.config = extend({}, DEFAULT_OPTIONS, config);
    if (typeof callbacks === 'function') {
      this.callbacks = {gestureDetected: callbacks}
    } else {
      this.callbacks = extend({}, AVAILABLE_CALLBACKS, callbacks);
    }
    this.plotter = plotter;
    // Outputs:
    this.freq = 0;
    this.maxVel = 0;
    this.hand = null;
    this.openHand = null;
    this.withinKnockDist = false;
    this._setupDirectionChangeAlg();
  }

  _setupDirectionChangeAlg() {
    let sound = new Howl({
      urls: [tapSound]
    });
    this.freqCalc = new DirectionChange({
      minAmplitude: this.config.minAmplitude,
      onDirChange: (data) => {
        if (this.hand && ((this.hand.type === 'right' && data.type === DirectionChange.LEFT_TO_RIGHT) ||
          (this.hand.type === 'left' && data.type === DirectionChange.RIGHT_TO_LEFT))) {
          if (this.handsWithinKnockDistance()) {
            // Sound effect!
            sound.play();
            this.withinKnockDist = true;
          } else {
            this.withinKnockDist = false;
          }
        }
      }
    });
  }

  handsWithinKnockDistance() {
    return Math.abs(this.hand.palmPosition[0] - this.openHand.palmPosition[0]) < this.config.maxKnockDist;
  }

  handClosed(hand) {
    return hand.grabStrength > this.config.closedGrabStrength;
  }

  handVertical(hand) {
    return hand.grabStrength < this.config.openGrabStrength &&
           Math.abs(Math.abs(hand.roll()) - Math.PI / 2) < this.config.handTwistTolerance;
  }

  setHandProps(hands) {
    hands.forEach((hand) => {
      hand.vertical = this.handVertical(hand);
      hand.closed = this.handClosed(hand);
    });
  }
  
  handleLeapFrame(frame) {
    this.setHandProps(frame.hands);
    if (frame.hands.length === 1) {
      return this.oneHandDetected(frame);
    }
    if (frame.hands.length === 2) {
      return this.twoHandsDetected(frame);
    }
    this.callbacks.leapState({
      numberOfHands: 0,
      verticalHand: null,
      closedHand: null
    });
    // Hide debug data.
    this.plotter.showCanvas(null);
  }

  oneHandDetected(frame) {
    let hand = frame.hands[0];
    let state = {
      numberOfHands: 1,
      verticalHand: null,
      closedHand: null
    };
    if (hand.vertical) {
      state.verticalHand = hand;
    } else if (hand.closed) {
      state.closedHand = hand;
    }
    this.callbacks.leapState(state);
  }

  twoHandsDetected(frame) {
    let hands = frame.hands;
    let state = {
      numberOfHands: 2,
      verticalHand: null,
      closedHand: null
    };
    if (hands[0].vertical) {
      state.verticalHand = hands[0];
    } else if (hands[0].closed) {
      state.closedHand = hands[0];
    }
    if (hands[1].vertical) {
      state.verticalHand = hands[1];
    } else if (hands[1].closed) {
      state.closedHand = hands[1];
    }
    this.callbacks.leapState(state);
    if (state.verticalHand && state.closedHand) {
      return this.gestureDetected(state.closedHand, state.verticalHand);
    }
  }

  gestureDetected(closedHand, openHand) {
    this.hand = closedHand;
    this.openHand = openHand;
    this.freqCalc.addSample(this.hand.palmVelocity[0]);
    this.freq = this.freqCalc.frequency;
    this.maxVel = this.freqCalc.halfPeriodMaxVel;
    if (this.withinKnockDist) {
      this.callbacks.gestureDetected(this.freq);
    }
  }
}

function oppositeHand(type) {
  return type === 'left' ? 'right' : 'left';
}