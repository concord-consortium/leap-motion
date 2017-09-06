import logger from '../common/js/tools/logger';

// Don't log any gesture that is shorter than 0.3s to avoid noise.
const MIN_GESTURE_DURATION = 0.3; // s

export default class GesturesLogger {
  constructor() {
    this._prevGestureTimestamp = null;
    this._prevGesture = null;
    this._prevDay = null;
    this._stats = {};
    this._statsTimestamp = null;
  }

  logGesture(data, gestureDetected, currentDay, orbitGesture) {
    const now = performance.now();
    let newGesture = null;
    if (orbitGesture && gestureDetected) {
      newGesture = 'Gesture:OrbitAligned';
    } else if (orbitGesture && !gestureDetected && data.numberOfHands === 1) {
      newGesture = 'Gesture:OrbitNotAligned';
    } else if (gestureDetected && data.numberOfHands === 1) {
      newGesture = 'Gesture:SetAngle';
    } else if (gestureDetected && data.numberOfHands === 2) {
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
    // Setup stats when some gesture is detected (and there were no hands visible before).
    if (this._prevGesture === null && newGesture !== null) {
      this._stats = {};
      this._statsTimestamp = now;
    }
    // Collect statistics on single gesture and try to log them.
    if (this._prevGesture && this._prevGesture !== newGesture) {
      const duration = (now - this._prevGestureTimestamp) / 1000;
      if (duration > MIN_GESTURE_DURATION) {
        logger.log(this._prevGesture, {
          duration,
          day: currentDay,
          prevDay: this._prevDay
        });
      }
      if (!this._stats[this._prevGesture]) {
        this._stats[this._prevGesture] = 0;
      }
      this._stats[this._prevGesture] += duration;
      this._prevGestureTimestamp = null;
    }
    // Log statistic when hands interaction is finished.
    if (this._prevGesture !== null && newGesture === null) {
      const duration = (now - this._statsTimestamp) / 1000;
      Object.keys(this._stats).forEach(key => {
        this._stats[key] = (this._stats[key] / duration) * 100;
      });
      logger.log('HandsInteractionSummary', {
        duration,
        stats: this._stats
      });
    }

    this._prevGesture = newGesture;
    if (this._prevGestureTimestamp === null && newGesture !== null) {
      this._prevGestureTimestamp = now;
      this._prevDay = currentDay;
    }
  }
}
