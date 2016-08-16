import {Howl} from 'howler';
import DirectionChange from '../common/js/tools/direction-change';
import tapSound from '../common/sounds/tap.wav'
import extend from '../common/js/tools/extend';

const DEFAULT_CONFIG = {
  minAmplitude: 20,
  closedGrabStrength: 0.7,
  soundEnabled: false
};

export default class FistBump {
  constructor(config) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    this._setupDirectionChangeAlg();
  }

  _setupDirectionChangeAlg() {
    let sound = new Howl({
      urls: [tapSound]
    });
    this.freqCalc = new DirectionChange({
      minAmplitude: this.config.minAmplitude,
      onDirChange: (data) => {
        if (this.config.soundEnabled && data.type === DirectionChange.RIGHT_TO_LEFT) {
          sound.play();
        }
      }
    });
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
    const gestureData = {
      numberOfHands: frame.hands.length,
      numberOfClosedHands: closedHands,
    };
    if (frame.hands.length === 2 && closedHands === 2) {
      const velocityDiff = hand1.palmVelocity[0] - hand2.palmVelocity[0];
      this.freqCalc.addSample(velocityDiff);
      gestureData.frequency = this.freqCalc.frequency;
    }
    return gestureData;
  }
}
