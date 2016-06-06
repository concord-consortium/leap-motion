import extend from '../common/js/tools/extend';
import THREE from 'three';

const MAX_VELOCITY = 200;
const HAND_TWIST_TOLERANCE = 0.7; // radians
const HAND_POINTING_LEFT_TOLERANCE = 0.8; // radians
// Positive Z axis points towards user. See:
// https://di4564baj7skl.cloudfront.net/assets/leapjs/Leap_Axes_annotated-d06820cfbcb73e553f65e3774490ac36.png
const PALM_POINTING_LEFT_NORMAL = [0, 0, 1];
const PALM_POINTING_FRONT_NORMAL = [-1, 0, 0];

const DEFAULT_CONFIG = {
  minDist: 80,
  maxDist: 250
};

const AVAILABLE_CALLBACKS = {
  handAngleDetected: function (angle) {},
  twoHandsDistanceDetected: function (dist) {}
};

function len(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

function velocity(hand) {
  let v = hand.palmVelocity;
  return len(v[0], v[1], v[2]);
}

// Accepts two 3-element arrays, returns angle in radians.
function angleBetween(vec1, vec2) {
  const v1 = new THREE.Vector3(vec1[0], vec1[1], vec1[2]);
  const v2 = new THREE.Vector3(vec2[0], vec2[1], vec2[2]);
  return v1.angleTo(v2);
}

function isVertical(hand) {
  return Math.abs(Math.abs(hand.roll()) - Math.PI / 2) < HAND_TWIST_TOLERANCE;
}

function isPointingLeft(hand) {
  return angleBetween(hand.palmNormal, PALM_POINTING_LEFT_NORMAL) < HAND_POINTING_LEFT_TOLERANCE;
}

function isPointingFront(hand) {
  return angleBetween(hand.palmNormal, PALM_POINTING_FRONT_NORMAL) < HAND_POINTING_LEFT_TOLERANCE;
}

function getHands(frame) {
  const hands = frame.hands;
  return {
    left: hands[0].type === 'left' ? hands[0] : hands[1],
    right: hands[0].type === 'right' ? hands[0] : hands[1]
  };
}

function getHandAngle(hand) {
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
  return angle;
}

export default class SunrayAngle {
  constructor(callbacks, getActiveRaysViewFunc) {
    this.config = extend({}, DEFAULT_CONFIG);
    this.callbacks = extend({}, AVAILABLE_CALLBACKS, callbacks);
    this.getActiveRaysView = getActiveRaysViewFunc;
    this.plotter = null;
  }

  get groundViewActive() {
    return this.getActiveRaysView() === 'ground';
  }

  get spaceViewActive() {
    return this.getActiveRaysView() === 'space';
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
    if (this.groundViewActive && velocity(frame.hands[0]) < MAX_VELOCITY) {
      return 'oneHandAngleDetected';
    }
    return null;
  }

  state_twoHandsDetected(frame, data) {
    const hands = getHands(frame);
    if (this.spaceViewActive && isPointingLeft(hands.right)) {
      return 'twoHandsAngleDetected';
    }
    if (isVertical(hands.left) && isVertical(hands.right) && isPointingFront(hands.right)) {
      return 'twoHandsDistanceDetected';
    }
    return null;
  }

  state_oneHandAngleDetected(frame, data) {
    const angle = getHandAngle(frame.hands[0]);
    this.plotter.showCanvas('one-hand-angle-detected');
    this.plotter.plot('angle', angle);
    this.plotter.update();
    this.callbacks.handAngleDetected(angle);
    return null;
  }

  state_twoHandsAngleDetected(frame, data) {
    const hands = getHands(frame);
    const angle = getHandAngle(hands.left);
    this.plotter.showCanvas('two-hands-angle-detected');
    this.plotter.plot('left hand angle', angle);
    this.plotter.update();
    this.callbacks.handAngleDetected(angle);
    return null;
  }

  state_twoHandsDistanceDetected(frame, data) {
    let p1 = frame.hands[0].palmPosition;
    let p2 = frame.hands[1].palmPosition;
    let dist = len(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
    dist = Math.min(this.config.maxDist, Math.max(this.config.minDist, dist));
    dist = (dist - this.config.minDist) / (this.config.maxDist - this.config.minDist);
    this.plotter.showCanvas('two-hands-distance-detected');
    this.plotter.plot('dist', dist);
    this.plotter.update();

    this.callbacks.twoHandsDistanceDetected(dist);
    return null;
  }
}
