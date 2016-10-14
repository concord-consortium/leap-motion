import {Howl} from 'howler';
import DirectionChange from '../common/js/tools/direction-change';
import tapSound from '../common/sounds/tap.wav'
import extend from '../common/js/tools/extend';

const DEFAULT_CONFIG = {
  closedGrabStrength: 0.7,
  minAmplitude: 60,
  soundEnabled: false,
  sideOffset: 100,
  sideMinTime: 500, // ms
  initialSideMinTime: 2500 // ms
};

export default class FistsShaking {
  constructor(config) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    this.currentlySelectedSide = null;
    this.currentlySelectedSideTimestamp = Infinity;
    this.selectedSide = null;
    this._setupDirectionChangeAlg();
  }

  _setupDirectionChangeAlg() {
    let sound = new Howl({
      urls: [tapSound]
    });
    const soundOnDirChange = (data) => {
      if (this.config.soundEnabled && data.type === DirectionChange.LEFT_TO_RIGHT) {
        sound.play();
      }
    };
    this.freqCalc = {
      left:  new DirectionChange({
        minAmplitude: this.config.minAmplitude,
        onDirChange: soundOnDirChange
      }),
      right: new DirectionChange({
        minAmplitude: this.config.minAmplitude,
        onDirChange: soundOnDirChange
      })
    };
  }

  getCurrentlySelectedSide(hand1, hand2) {
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
    const newSelectedSide = closedHands === 2 ? this.getCurrentlySelectedSide(hand1, hand2) : null;
    if (this.currentlySelectedSide !== newSelectedSide) {
      this.currentlySelectedSideTimestamp = Date.now();
      this.currentlySelectedSide = newSelectedSide;
    }
    // If side is selected for the first time, use a bit different required time (longer, so user can read tips).
    const reqTime = this.selectedSide === null ? this.config.initialSideMinTime : this.config.sideMinTime;
    if (newSelectedSide !== 'unclear' && Date.now() - this.currentlySelectedSideTimestamp > reqTime) {
      // Update selected side only if it's clearly defined.
      this.selectedSide = newSelectedSide;
    }

    const gestureData = {
      numberOfHands: frame.hands.length,
      numberOfClosedHands: closedHands,
      selectedSide: this.selectedSide
    };
    if (closedHands === 2 && this.selectedSide) {
      const freqCalc = this.freqCalc[this.selectedSide];
      const xVelDiff = hand2.palmVelocity[0] - hand1.palmVelocity[0];
      freqCalc.addSample(xVelDiff);
      gestureData.frequency = freqCalc.frequency;
    }
    return gestureData;
  }
}
