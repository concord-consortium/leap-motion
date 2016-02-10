import extend from '../common/js/tools/extend';

const MAX_VELOCITY = 100;
const HAND_TWIST_TOLERANCE = 0.7;

const DEFAULT_CONFIG = {
  minDist: 80,
  maxDist: 250
};

const AVAILABLE_CALLBACKS = {
  oneHandGestureDetected: function (angle) {},
  twoHandsGestureDetected: function (dist) {}
};

export default class SunrayAngle {
  constructor(callbacks) {
    this.config = extend({}, DEFAULT_CONFIG);
    this.callbacks = extend({}, AVAILABLE_CALLBACKS, callbacks);
    this.plotter = null;
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
    if (frame.hands.length === 2) {
      return 'twoHandsDetected';
    }
    // Hide debug data.
    this.plotter.showCanvas(null);
    return null;
  }

  state_oneHandDetected(frame, data) {
    if (velocity(frame.hands[0]) < MAX_VELOCITY) {
      return 'oneHandGestureDetected';
    }
    return null;
  }

  state_twoHandsDetected(frame, data) {
    let hands = frame.hands;
    if (isVertical(hands[0]) && isVertical(hands[1])) {
      return 'twoHandsGestureDetected';
    }
    return null;
  }

  state_oneHandGestureDetected(frame, data) {
    let hand = frame.hands[0];
    let angle = hand.roll() * 180 / Math.PI;
    // Limit angle to [0, 180] range and do some conversions so it's matching angle provided by Seasons model.
    if (hand.type === 'left') {
      if (angle < 0 && angle > -90) {
        angle = 0;
      } else if (angle <= -90) {
        angle = 180;
      }
    } else if (hand.type === 'right') {
      angle += 180;
      if (angle > 180 && angle < 270) {
        angle = 180;
      } else if (angle >= 270) {
        angle = 0;
      }
    }
    this.plotter.showCanvas('one-hand-gesture-detected');
    this.plotter.plot('angle', angle);
    this.plotter.update();

    this.callbacks.oneHandGestureDetected(angle);
    return null;
  }

  state_twoHandsGestureDetected(frame, data) {
    let p1 = frame.hands[0].palmPosition;
    let p2 = frame.hands[1].palmPosition;
    let dist = len(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
    dist = Math.min(this.config.maxDist, Math.max(this.config.minDist, dist));
    dist = (dist - this.config.minDist) / (this.config.maxDist - this.config.minDist);
    this.plotter.showCanvas('two-hands-gesture-detected');
    this.plotter.plot('dist', dist);
    this.plotter.update();

    this.callbacks.twoHandsGestureDetected(dist);
    return null;
  }
}

function isVertical(hand) {
  return Math.abs(Math.abs(hand.roll()) - Math.PI / 2) < HAND_TWIST_TOLERANCE;
}

function velocity(hand) {
  let v = hand.palmVelocity;
  return len(v[0], v[1], v[2]);
}

function len(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}
