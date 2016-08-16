import {Howl} from 'howler';
import DirectionChange from '../common/js/tools/direction-change';
import tapSound from '../common/sounds/tap.wav'
import extend from '../common/js/tools/extend';

const DEFAULT_CONFIG = {
  closedGrabStrength: 0.7,
  minAmplitude: 20,
  soundEnabled: false,
  sideOffset: 100
};

export default class FistsShaking {
  constructor(config) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    this.lastSelectedSide = null;
    this._setupDirectionChangeAlg();
  }

  _setupDirectionChangeAlg() {
    let sound = new Howl({
      urls: [tapSound]
    });
    this.freqCalc = new DirectionChange({
      minAmplitude: this.config.minAmplitude,
      onDirChange: (data) => {
        if (this.config.soundEnabled && data.type === DirectionChange.LEFT_TO_RIGHT) {
          sound.play();
        }
      }
    });
  }

  selectedSide(hand1, hand2) {
    const leftSide = hand1.palmPosition[0] < this.config.sideOffset && hand2.palmPosition[0] < this.config.sideOffset;
    const rightSide = hand1.palmPosition[0] > -this.config.sideOffset && hand2.palmPosition[0] > -this.config.sideOffset;
    // Note that both leftSide and rightSide can be equal to true (as the left and right side overlap).
    if (leftSide && !rightSide) {
      return 'left';
    }
    if (!leftSide && rightSide) {
      return 'right';
    }
    return 'unclear';
  }

  handleLeapFrame(frame) {
    let hand1 = frame.hands[0];
    let hand2 = frame.hands[1];
    if (hand1 && hand2 && hand1.palmPosition[0] > hand2.palmPosition[0]) {
      // Make sure that hand1 is the left hand.
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
    const newSelectedSide = closedHands === 2 ? this.selectedSide(hand1, hand2) : null;
    // Update selected side only if it's clearly defined.
    if (newSelectedSide !== 'unclear') {
      this.lastSelectedSide = newSelectedSide;
    }
    const gestureData = {
      numberOfHands: frame.hands.length,
      numberOfClosedHands: closedHands,
      selectedSide: this.lastSelectedSide
    };
    if (closedHands === 2) {
      const xVelDiff = hand2.palmVelocity[0] - hand1.palmVelocity[0];
      this.freqCalc.addSample(xVelDiff);
      gestureData.frequency = this.freqCalc.frequency;
    }
    return gestureData;
  }
}
