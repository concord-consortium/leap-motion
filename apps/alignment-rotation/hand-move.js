import DirectionChange from '../common/js/tools/direction-change';
import extend from '../common/js/tools/extend';

const DEFAULT_CONFIG = {
  closedGrabStrength: 0.7,
  resetHandTimeout: 500
};

export default class HandMove {
  constructor(config, callbacks) {
    this.config = extend({}, DEFAULT_CONFIG, config);
    this.callbacks = callbacks;
    this.savedHandType = null;
    this.resetHandTimeoutID = null;
  }

  updateSavedHandType(type) {
    // Save hand type at the beginning of gesture. Leap seems to be struggling with hand type
    // detection once fist is closed and sometimes erroneously switches reported type.
    // At this point hand type should be still reliable and we make sure that it'll be consistent
    // while user is moving their hand
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

  handleLeapFrame(frame, previousFrame) {
    let hand = frame.hands[0];
    let closedHand = hand && hand.grabStrength > this.config.closedGrabStrength ? hand : null;
    if (frame.hands.length === 1) {
      let t = hand.translation(previousFrame);
      // calculate pointer angle, if a pointer is present
      let activePointers = frame.pointables.filter(function (pointer){
        // first finger, only if extended and valid
        return pointer.type==1 && pointer.extended && pointer.valid;
      });
      // in case user is using more than one finger
      let pointable = activePointers[0];

      if (closedHand){
        this.updateSavedHandType(closedHand.type);
      }
      this.callbacks.leapState({
        numberOfHands: frame.hands.length,
        closedHandType: this.savedHandType
      });
      this.callbacks.gestureDetected({
        translation: t,
        pointable: pointable,
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
