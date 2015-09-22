import avg from '../tools/avg';
import {Howl} from 'howler';
import DirectionChange from '../tools/direction-change';

export default class FistBump {
  constructor(config, callback, plotter) {
    this.config = config;
    this.callback = callback;
    this.plotter = plotter;
    // Outputs:
    this.freq = 0;
    this.maxVel = 0;
    this.hand = null;
    this._setupDirectionChangeAlg();
  }

  _setupDirectionChangeAlg() {
    let lastDirChange = null;
    let sound = new Howl({
      urls: ['tap.wav']
    });
    this.freqCalc = new DirectionChange({
      minAmplitude: this.config.minAmplitude,
      onDirChange: function (data) {
        let timestamp = Date.now();
        if (lastDirChange) {
          this.freq = 0.5 * 1000 / (timestamp - lastDirChange);
          this.maxVel = data.maxVelocity;
        }
        lastDirChange = timestamp;
        if (this.hand && ((this.hand.type === 'right' && data.type === DirectionChange.LEFT_TO_RIGHT) ||
                          (this.hand.type === 'left' && data.type === DirectionChange.RIGHT_TO_LEFT))) {
          // Sound effect!
          sound.play();
        }
      }.bind(this),
      onStop: function () {
        lastDirChange = Date.now();
        this.freq = 0;
        this.maxVel = 0;
      }.bind(this)
    });
  }

  nextLeapState(stateId, frame, data) {
    let stateFuncName = 'state_' + stateId;
    return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
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
    if (condition(0, 1)) {
      return {stateId: 'gestureDetected', data: {closedHand: frame.hands[0], openHand: frame.hands[1]}};
    } else if (condition(1, 0)) {
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
    avg.addSample('fistXVel', this.hand.palmVelocity[0], 6);
    this.freqCalc.addSample(avg.getAvg('fistXVel'), this.hand.palmPosition[0]);
    this.callback();
    return null;
  }
}
