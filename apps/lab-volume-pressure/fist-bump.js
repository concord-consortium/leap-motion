import {Howl} from 'howler';
import avg from '../common/js/tools/avg';
import DirectionChange from '../common/js/tools/direction-change';
import extend from '../common/js/tools/extend';
import tapSound from '../common/sounds/tap.wav'


const DEFAULT_CONFIG = {
  closedGrabStrength: 0.4,
  openGrabStrength: 0.7,
  handTwistTolerance: 0.7,
  minAmplitude: 20,
  maxKnockDist: 150,
  orientationFlipDelay: 1000
};

const AVAILABLE_CALLBACKS = {
  leapState: function (state) {},
  // Closed fist bumping against flat hand within knocking distance.
  gestureDetected: function (gestureState) {},
  // Orientation can be "left" or "right", it's defined by the vertical hand.
  orientationDetected: function (orientation) {}
};

export default class FistBump {
  constructor(config, callbacks) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    if (typeof callbacks === 'function') {
      this.callbacks = {gestureDetected: callbacks}
    } else {
      this.callbacks = extend({}, AVAILABLE_CALLBACKS, callbacks);
    }
    this.orientationEstablishedTimestamp = Infinity;
    this.closedHand = {};
    this.verticalHand = {};
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
        if (this.closedHand && ((this.closedHand.type === 'right' && data.type === DirectionChange.LEFT_TO_RIGHT) ||
          (this.closedHand.type === 'left' && data.type === DirectionChange.RIGHT_TO_LEFT))) {
          if (this.handsWithinKnockDistance(this.closedHand, this.verticalHand)) {
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

  handsWithinKnockDistance(closedHand, verticalHand) {
    return Math.abs(closedHand.palmPosition[0] - verticalHand.palmPosition[0]) < this.config.maxKnockDist;
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
    this.gestureNotDetected();
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
    this.gestureNotDetected();
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
    this.gestureNotDetected();
  }

  gestureDetected(closedHand, verticalHand) {
    if (verticalHand.type === this.verticalHand.type &&
        closedHand.type === this.closedHand.type &&
        Date.now() - this.orientationEstablishedTimestamp > this.config.orientationFlipDelay) {
      this.callbacks.orientationDetected(verticalHand.type);
      this.orientationEstablishedTimestamp = Infinity;
    }
    if (verticalHand.type !== this.verticalHand.type) {
      this.orientationEstablishedTimestamp = Date.now();
    }
    this.closedHand = closedHand;
    this.verticalHand = verticalHand;

    this.freqCalc.addSample(this.closedHand.palmVelocity[0]);
    if (this.withinKnockDist) {
      this.callbacks.gestureDetected(this.freqCalc.frequency);
    }
  }

  gestureNotDetected() {
    this.orientationEstablishedTimestamp = Infinity;
    this.closedHand = {};
    this.verticalHand = {};
  }
}
