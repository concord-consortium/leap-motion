import {Howl} from 'howler';
import DirectionChange from '../common/js/tools/direction-change';
import tapSound from '../common/sounds/tap.wav'
import extend from '../common/js/tools/extend';

const DEFAULT_CONFIG = {
  closedGrabStrength: 0.7,
  minAmplitude: 20,
  soundEnabled: false,
  resetHandTimeout: 500
};

let lastFrameID = 0;

export default class FistBump {
  constructor(config, callbacks) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    this.callbacks = callbacks;
    this.savedHandType = null;
    this.resetHandTimeoutID = null;
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

  updateSavedHandType(type) {
    // Save hand type at the beginning of gesture. Leap seems to be struggling with hand type
    // detection once fist is closed and sometimes erroneously switches reported type.
    // At this point hand type should be still reliable and we make sure that it'll be consistent
    // while user is shaking his hand.
    if (!this.savedHandType) {
      this.savedHandType = type;
    }
    if (this.resetHandTimeoutID !== null) {
      clearTimeout(this.resetHandTimeoutID);
      this.resetHandTimeoutID = null;
    }
  }

  resetSavedHandType() {
    if (this.resetHandTimeoutID === null) {
      this.resetHandTimeoutID = setTimeout(() => {
        this.savedHandType = null;
      }, this.config.resetHandTimeout);
    }
  }


  handleLeapFrame(frame) {
    if (frame.id === lastFrameID) {
      // skip repeated frame - this could be happening due to the lab simulation frame rate causing issues with handling Leap frames
      return;
    }
    lastFrameID = frame.id;

    let hand = frame.hands[0];
    let closedHand = hand && hand.grabStrength > this.config.closedGrabStrength ? hand : null;
    if (frame.hands.length === 1 && closedHand) {
      this.updateSavedHandType(closedHand.type);
      const freqCalc = this.freqCalc[this.savedHandType];
      freqCalc.addSample(closedHand.palmVelocity[0]);
      this.callbacks.leapState({
        numberOfHands: frame.hands.length,
        closedHandType: this.savedHandType
      });
      this.callbacks.gestureDetected({
        frequency: freqCalc.frequency,
        closedHandType: this.savedHandType
      });
    } else {
      this.resetSavedHandType();
      this.callbacks.leapState({
        numberOfHands: frame.hands.length,
        closedHandType: null
      });
    }
  }
}
