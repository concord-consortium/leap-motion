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
  twoHandsAngleDetection: false,
  closedGrabStrength: 0.7,
  resetHandTimeout: 500
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
     this.savedHandType = null;
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


  distanceBetweenHands(leftHand, rightHand) {
    let p1 = leftHand.palmPosition;
    let p2 = rightHand.palmPosition;
    let dist = len(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
    dist = Math.min(this.config.maxDist, Math.max(this.config.minDist, dist));
    return (dist - this.config.minDist) / (this.config.maxDist - this.config.minDist);
  }

  processLeapFrame(frame, previousFrame) {
    const hands = frame.hands;
    const data = {};
    data.numberOfHands = hands.length;
    if (data.numberOfHands === 1) {
      let hand = hands[0];
      this.updateSavedHandType(hand.type);
      data.handType = this.savedHandType;
      data.handStill = velocity(hand) < MAX_VELOCITY;
      data.handAngle = getHandAngle(hand);
      let handClosed = hand.grabStrength > this.config.closedGrabStrength;
      data.handClosed = handClosed;

      let activePointers = frame.pointables.filter(function (pointer){
        // first finger, only if extended and valid
        return pointer.type==1 && pointer.extended && pointer.valid;
      });
      // in case user is using more than one finger
      let pointable = activePointers[0];
      if (pointable && activePointers.length === 1) {
        data.pointerDirection = pointable.direction;
        data.isPointing = true
      }

      if (previousFrame) {
        let previousHandClosed = previousFrame.hands.length > 0 && previousFrame.hands[0].grabStrength > this.config.closedGrabStrength;
        data.handClosedChanged = handClosed != previousHandClosed;

        let t = hand.translation(previousFrame);
        if (Math.abs(t[0]) > 2 || Math.abs(t[2]) > 2) {
          data.handTranslation = t;
        }
      }
      if (this.config.twoHandsAngleDetection) {
        data.rightHandPointingLeft = hand.type === 'right' && isPointingLeft(hand);
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
    } else {
      this.resetSavedHandType();
    }
    return data;
  }
}
