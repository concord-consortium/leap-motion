import {Howl} from 'howler';
import avg from '../tools/avg';
import DirectionChange from '../tools/direction-change';
import extend from '../tools/extend';
import tapSound from '../../sounds/tap.wav'

const DEFAULT_OPTIONS = {
  closedGrabStrength: 0.4,
  openGrabStrength: 0.7,
  handTwistTolerance: 0.7,
  minAmplitude: 20,
  allowedHand: { // moving and closed hand
    left: true,
    right: true
  },
  maxKnockDist: 150
};

export default class FistBump {
  constructor(config, callback, plotter) {
    this.config = extend({}, DEFAULT_OPTIONS, config);
    this.callback = callback;
    this.plotter = plotter;
    // Outputs:
    this.freq = 0;
    this.maxVel = 0;
    this.hand = null;
    this.openHand = null;
    this.active = false;
    this._setupDirectionChangeAlg();
  }

  _setupDirectionChangeAlg() {
    let sound = new Howl({
      urls: [tapSound]
    });
    this.freqCalc = new DirectionChange({
      minAmplitude: this.config.minAmplitude,
      onDirChange: function (data) {
        if (this.hand && ((this.hand.type === 'right' && data.type === DirectionChange.LEFT_TO_RIGHT) ||
                          (this.hand.type === 'left' && data.type === DirectionChange.RIGHT_TO_LEFT))) {
          if (this.handsWithinKnockDistance()) {
            // Sound effect!
            sound.play();
            this.active = true;
          } else {
            this.active = false;
          }
        }
      }.bind(this)
    });
  }

  nextLeapState(stateId, frame, data) {
    let stateFuncName = 'state_' + stateId;
    return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
  }

  handsWithinKnockDistance() {
    return Math.abs(this.hand.palmPosition[0] - this.openHand.palmPosition[0]) < this.config.maxKnockDist;
  }

  handClosedAllowed(hand) {
    return this.config.allowedHand[hand.type];
  }

  handVerticalAllowed(hand) {
    return this.config.allowedHand[oppositeHand(hand.type)];
  }

  handClosed(hand) {
    return this.handClosedAllowed(hand) &&
           hand.grabStrength > this.config.closedGrabStrength;
  }

  handVertical(hand) {
    return this.handVerticalAllowed(hand) &&
           hand.grabStrength < this.config.openGrabStrength &&
           Math.abs(Math.abs(hand.roll()) - Math.PI / 2) < this.config.handTwistTolerance;
  }

  // State definitions:

  state_initial(frame, data) {
    if (frame.hands.length === 1) {
      return 'oneHandDetected';
    }
    if (frame.hands.length === 2) {
      return 'twoHandsDetected';
    }
    // Hide debug data.
    this.plotter.showCanvas(null);
    return null;
  }

  state_oneHandDetected(frame, data) {
    let hand = frame.hands[0];
    if (this.handVertical(hand)) {
      return 'verticalHandDetected';
    }
    if (this.handClosed(hand)) {
      return 'closedHandDetected';
    }
    // 'leftHandDetected' or 'rightHandDetected'
    return hand.type + 'HandDetected';
  }

  state_twoHandsDetected(frame, data) {
    let hands = frame.hands;
    if (this.handClosed(hands[0]) && this.handVertical(hands[1])) {
      return {stateId: 'gestureDetected', data: {closedHand: hands[0], openHand: hands[1]}};
    }
    if (this.handClosed(hands[1]) && this.handVertical(hands[0])) {
      return {stateId: 'gestureDetected', data: {closedHand: hands[1], openHand: hands[0]}};
    }
    if (this.handVertical(hands[0]) || this.handVertical(hands[1])) {
      return 'verticalHandDetected';
    }
    if (this.handClosed(hands[0]) || this.handClosed(hands[1])) {
      return 'closedHandDetected';
    }
    this.plotter.showCanvas('two-hands-detected');
    this.plotter.plot('hand 0 roll', hands[0].roll());
    this.plotter.plot('hand 1 grab strength', hands[1].grabStrength);
    this.plotter.update();
    return null;
  }
  
  state_gestureDetected(frame, data) {
    this.hand = data.closedHand;
    this.openHand = data.openHand;
    this.freqCalc.addSample(this.hand.palmVelocity[0]);
    this.freq = this.freqCalc.frequency;
    this.maxVel = this.freqCalc.halfPeriodMaxVel;
    if (this.active) {
      this.callback();
    }
    return null;
  }
}

function oppositeHand(type) {
  return type === 'left' ? 'right' : 'left';
}