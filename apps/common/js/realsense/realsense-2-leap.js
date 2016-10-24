import THREE from 'three';
import rs from './realsense';
const rsh = rs.hand;
const JT = rsh.JointType;

/*
 Required interface:
 .id
 .type - 'left' or 'right'
 .palmNormal
 .direction
 .palmPosition
 - fingers:
   .id
   .tipPosition
   .dipPosition - one before tip
   .pipPosition
   .mcpPosition
 .data(name, val)
*/

const handType = {
  [rsh.BodySideType.BODY_SIDE_UNKNOWN]: 'unknown',
  [rsh.BodySideType.BODY_SIDE_LEFT]: 'left',
  [rsh.BodySideType.BODY_SIDE_RIGHT]: 'right'
};

const handData = {};

// Convert RealSense object vector representation to LealMotion format and coords system.
function rs2lm(vec) {
  return [vec.x * -1, vec.y, vec.z];
}

// Convert vector in meter to array in meters.
function rs2lmPos(vec) {
  return rs2lm(vec).map(a => a * 1000);
}

function rsHandDirection(rsHand) {
  const joints = rsHand.trackedJoints;
  const center = new THREE.Vector3().copy(joints[JT.JOINT_WRIST].positionWorld);
  const middleBase = new THREE.Vector3().copy(joints[JT.JOINT_CENTER].positionWorld);
  return rs2lm(middleBase.sub(center).normalize());
}

function rsHandPalmNormal(rsHand) {
  const normal = rs2lm(new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().copy(rsHand.palmOrientation)));
  normal[0] *= -1;
  normal[2] *= -1;
  return normal;
  // Or using joints:
  // const joints = rsHand.trackedJoints;
  // const center = new THREE.Vector3().copy(joints[JT.JOINT_WRIST].positionWorld);
  // const indexBase = new THREE.Vector3().copy(joints[JT.JOINT_INDEX_BASE].positionWorld);
  // const pinkyBase = new THREE.Vector3().copy(joints[JT.JOINT_PINKY_BASE].positionWorld);
  // const indexVec = indexBase.sub(center);
  // const pinkyVec = pinkyBase.sub(center);
  // return rs2lm(pinkyVec.cross(indexVec).normalize());
}

export function realSenseHand2Leap(rsHand) {
  const hand = {};
  const joints = rsHand.trackedJoints;
  hand.id = rsHand.uniqueId;
  hand.type = handType[rsHand.bodySide];
  hand.palmPosition = rs2lmPos(joints[JT.JOINT_CENTER].positionWorld);
  hand.palmNormal = rsHandPalmNormal(rsHand);
  hand.direction = rsHandDirection(rsHand);
  hand.fingers = [
    {
      tipPosition: rs2lmPos(joints[JT.JOINT_THUMB_TIP].positionWorld),
      dipPosition: rs2lmPos(joints[JT.JOINT_THUMB_JT2].positionWorld),
      pipPosition: rs2lmPos(joints[JT.JOINT_THUMB_JT1].positionWorld),
      mcpPosition: rs2lmPos(joints[JT.JOINT_THUMB_BASE].positionWorld),
    },
    {
      tipPosition: rs2lmPos(joints[JT.JOINT_INDEX_TIP].positionWorld),
      dipPosition: rs2lmPos(joints[JT.JOINT_INDEX_JT2].positionWorld),
      pipPosition: rs2lmPos(joints[JT.JOINT_INDEX_JT1].positionWorld),
      mcpPosition: rs2lmPos(joints[JT.JOINT_INDEX_BASE].positionWorld),
    },
    {
      tipPosition: rs2lmPos(joints[JT.JOINT_MIDDLE_TIP].positionWorld),
      dipPosition: rs2lmPos(joints[JT.JOINT_MIDDLE_JT2].positionWorld),
      pipPosition: rs2lmPos(joints[JT.JOINT_MIDDLE_JT1].positionWorld),
      mcpPosition: rs2lmPos(joints[JT.JOINT_MIDDLE_BASE].positionWorld),
    },
    {
      tipPosition: rs2lmPos(joints[JT.JOINT_RING_TIP].positionWorld),
      dipPosition: rs2lmPos(joints[JT.JOINT_RING_JT2].positionWorld),
      pipPosition: rs2lmPos(joints[JT.JOINT_RING_JT1].positionWorld),
      mcpPosition: rs2lmPos(joints[JT.JOINT_RING_BASE].positionWorld),
    },
    {
      tipPosition: rs2lmPos(joints[JT.JOINT_PINKY_TIP].positionWorld),
      dipPosition: rs2lmPos(joints[JT.JOINT_PINKY_JT2].positionWorld),
      pipPosition: rs2lmPos(joints[JT.JOINT_PINKY_JT1].positionWorld),
      mcpPosition: rs2lmPos(joints[JT.JOINT_PINKY_BASE].positionWorld),
    }
  ];
  // Implement support of .data() function that lets you bind some data to the hand object.
  // Leap implements that interface too.
  hand.data = function (key, value) {
    if (arguments.length === 2) {
      if (!handData[this.id]) {
        handData[this.id] = {};
      }
      handData[this.id][key] = value;
      return value;
    } else {
      return handData[this.id] && handData[this.id][key];
    }
  };
  return hand;
}

export function realSenseFrame2Leap(data) {
  const frame = {};
  frame.hands = data.hands.map(h => realSenseHand2Leap(h));
  return frame;
}
