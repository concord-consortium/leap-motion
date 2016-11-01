import logger from '../common/js/tools/logger';

// Don't log any gesture that is shorter than 0.3s to avoid noise.
const MIN_GESTURE_DURATION = 0.3; // s

export default class GesturesLogger {
  constructor() {
    this._prevGestureTimestamp = null;
    this._prevGesture = null;
    this._prevDay = null;
  }

  logGesture(data, gestureDetected, currentDay) {
    let newGesture = null;
    if (gestureDetected && data.numberOfHands === 1) {
      newGesture = 'Gesture:SetAngle';
    } else if (gestureDetected && data.numberOfHands === 1) {
      newGesture = 'Gesture:SetDistance';
    } else if (data.numberOfHands === 1 && data.handType === 'left') {
      newGesture = 'Gesture:OneHandNotAligned';
    } else if (data.numberOfHands === 1 && data.handType === 'right') {
      newGesture = 'Gesture:OneHandNotAligned';
    } else if (data.numberOfHands === 2 && !data.handsVertical) {
      newGesture = 'Gesture:TwoHandsNotVertical';
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      newGesture = 'Gesture:TwoHandsNotAligned';
    }
    if (this._prevGesture && this._prevGesture !== newGesture) {
      const duration = (Date.now() - this._prevGestureTimestamp) / 1000;
      if (duration > MIN_GESTURE_DURATION) {
        logger.log(this._prevGesture, {
          duration,
          day: currentDay,
          prevDay: this._prevDay
        });
      }
      this._prevGestureTimestamp = null;
    }
    this._prevGesture = newGesture;
    if (this._prevGestureTimestamp === null && newGesture !== null) {
      this._prevGestureTimestamp = Date.now();
      this._prevDay = currentDay;
    }
  }
}
