import rs from './realsense';

/*
Required interface:
.type - 'left' or 'right'
.palmNormal
.direction
.palmPosition
- fingers:
 .tipPosition
 .dipPosition - one before tip
 .pipPosition
 .mcpPosition
 .carpPosition - next to the wrist
.data(name, val)
 */

// Convert RealSense object vector representation to LealMotion format and coords system.
function rs2lm(vec) {
  return [vec.x * -1, vec.y, vec.z];
}

// Convert vector in meter to array in meters.
function rs2lmPos(vec) {
  return rs2lm(vec).map(a => a * 1000);
}

function rsHand2Leap(rsHand) {
  const hand = {};
  hand.palmPosition = rs2lmPos(rsHand.massCenterWorld);
  return hand;
}

export default function realSense2Leap(data) {
  const frame = {};
  const rsHands = data.queryHandData(rs.hand.AccessOrderType.ACCESS_ORDER_FIXED);
  frame.hands = rsHands.map(h => rsHand2Leap(h));
  return frame;
}
