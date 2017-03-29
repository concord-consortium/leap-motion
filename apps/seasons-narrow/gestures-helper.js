import extend from '../common/js/tools/extend';
import THREE from 'three';

const MAX_VELOCITY = 200;
const HAND_TWIST_TOLERANCE = 0.7; // radians
const HAND_POINTING_LEFT_TOLERANCE = 1.1; // radians
// Positive Z axis points towards user. See:
// https://di4564baj7skl.cloudfront.net/assets/leapjs/Leap_Axes_annotated-d06820cfbcb73e553f65e3774490ac36.png
const PALM_POINTING_LEFT_NORMAL = [0, 0, 1];
const DEFAULT_CONFIG = {
  minDist: 80,
  maxDist: 250,
  // Enables calculation of new properties, keep disabled if not necessary.
  twoHandsAngleDetection: false
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

export default class GesturesHelper {
  constructor() {
    this.config = extend({}, DEFAULT_CONFIG);
  }

  distanceBetweenHands(leftHand, rightHand) {
    let p1 = leftHand.palmPosition;
    let p2 = rightHand.palmPosition;
    let dist = len(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
    dist = Math.min(this.config.maxDist, Math.max(this.config.minDist, dist));
    return (dist - this.config.minDist) / (this.config.maxDist - this.config.minDist);
  }

  processLeapFrame(frame) {
    const hands = frame.hands;
    const data = {};
    data.numberOfHands = hands.length;
    if (data.numberOfHands === 1) {
      data.handType = hands[0].type;
      data.handStill = velocity(hands[0]) < MAX_VELOCITY;
      data.handAngle = getHandAngle(hands[0]);
      if (this.config.twoHandsAngleDetection) {
        data.rightHandPointingLeft = hands[0].type === 'right' && isPointingLeft(hands[0]);
      }
    } else if (data.numberOfHands === 2) {
      const leftHand = hands[0].type === 'left' ? hands[0] : hands[1];
      const rightHand = hands[0].type === 'right' ? hands[0] : hands[1];
      data.handsVertical = isVertical(leftHand) && isVertical(rightHand);
      data.handsDistance = this.distanceBetweenHands(leftHand, rightHand);
      if (this.config.twoHandsAngleDetection) {
        data.leftHandAngle = getHandAngle(leftHand);
        data.rightHandPointingLeft = isPointingLeft(rightHand);
      }
    }
    return data;
  }
}
