import avg from '../tools/avg';
import {Howl} from 'howler';
import DirectionChange from '../tools/direction-change';
import extend from '../tools/extend';

const DEFAULT_OPTIONS = {
  closedGrabStrength: 0.4,
  openGrabStrength: 0.7,
  handTwistTolerance: 0.7,
  minAmplitude: 20,
  allowedHand: {
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
      urls: ['tap.wav']
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

  // State definitions:

  state_initial(frame, data) {
    if (frame.hands.length === 2) {
      return 'twoHandsDetected';
    }
    // Hide debug data.
    this.plotter.showCanvas(null);
    return null;
  }

  state_twoHandsDetected(frame, data) {
    let config = this.config;
    function condition(closedHandIdx, openHandIdx) {
      let closedHand = frame.hands[closedHandIdx];
      let openHand = frame.hands[openHandIdx];
      if (closedHand.grabStrength > config.closedGrabStrength && openHand.grabStrength < config.openGrabStrength &&
          Math.abs(Math.abs(openHand.roll()) - Math.PI / 2) < config.handTwistTolerance) {
        return true;
      }
      return false;
    }
    if (condition(0, 1) && this.config.allowedHand[frame.hands[0].type]) {
      return {stateId: 'gestureDetected', data: {closedHand: frame.hands[0], openHand: frame.hands[1]}};
    } else if (condition(1, 0) && this.config.allowedHand[frame.hands[1].type]) {
      return {stateId: 'gestureDetected', data: {closedHand: frame.hands[1], openHand: frame.hands[0]}};
    } else {
      this.plotter.showCanvas('two-hands-detected');
      this.plotter.plot('hand 0 roll', frame.hands[0].roll());
      this.plotter.plot('hand 1 grab strength', frame.hands[1].grabStrength);
      this.plotter.update();
      return null;
    }
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
