import {Howl} from 'howler';
import avg from '../common/js/tools/avg';
import DirectionChange from '../common/js/tools/direction-change';
import tapSound from '../common/sounds/tap.wav'

export default class FistBump {
  constructor(config, callback, plotter) {
    this.config = config;
    this.callback = callback;
    this.plotter = plotter;
    // Outputs:
    this.freq = 0;
    this.hand = null;
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
          // Sound effect!
          sound.play();
        }
      }.bind(this)
    });
  }

  nextLeapState(stateId, frame, data) {
    let stateFuncName = 'state_' + stateId;
    return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
  }

  // State definitions:

  state_initial(frame, data) {
    if (frame.hands.length === 1) {
      return 'oneHandDetected';
    }
    // Hide debug data.
    this.plotter.showCanvas(null);
    return null;
  }

  state_oneHandDetected(frame, data) {
    if (frame.hands[0].grabStrength > this.config.closedGrabStrength) {
      return 'gestureDetected';
    } else {
      this.plotter.showCanvas('one-hand-detected');
      this.plotter.plot('grab strength', frame.hands[0].grabStrength);
      this.plotter.update();
      return null;
    }
  }
  
  state_gestureDetected(frame, data) {
    this.hand = frame.hands[0];
    this.freqCalc.addSample(this.hand.palmVelocity[0]);
    this.freq = this.freqCalc.frequency;
    this.callback();
    return null;
  }
}
