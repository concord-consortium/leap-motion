import THREE from 'three';
import rigs from 'exports-loader?rigs!../lib/leap-rigged-hand/hand_models_v1';
import extend from '../tools/extend';

// TODO: probably it should be integrated with phantom-hands.js module.
// This module lets you:
// 1. Save hand description.
// 2. Add a "phantom" hand to Rigged Hand view.
// Most of these functions are based on the leap.rigged-hand-0.1.7.js source (look for similar function names there).
// Quite often it's a copy-paste version which is slightly simplified.
// Plugin itself don't allow to do anything like this. Also, its development is pretty dead at the moment,
// so it seems to be the best / simplest solution.

// Cache.
const spareMeshes = {
  left: [],
  right: []
};

// Based on leap.rigged-hand-0.1.7#createMesh function.
function createMesh(riggedHand, JSON) {
  const data = (new THREE.JSONLoader).parse(JSON);
  data.materials[0].skinning = true;
  data.materials[0].transparent = true;
  data.materials[0].opacity = 0.7;
  data.materials[0].emissive.setHex(0x888888);
  data.materials[0].vertexColors = THREE.VertexColors;
  data.materials[0].depthTest = true;
  extend(data.materials[0], riggedHand.scope.materialOptions);
  extend(data.geometry, riggedHand.scope.geometryOptions);
  const handMesh = new THREE.SkinnedMesh(data.geometry, data.materials[0]);
  handMesh.positionRaw = new THREE.Vector3;
  handMesh.fingers = handMesh.children[0].children;
  handMesh.castShadow = true;
  handMesh.bonesBySkinIndex = {};
  let i = 0;
  handMesh.children[0].traverse(function(bone) {
    bone.skinIndex = i;
    handMesh.bonesBySkinIndex[i] = bone;
    return i++;
  });
  handMesh.boneLabels = {};
  handMesh.scaleFromHand = function(leapHand) {
    const middleProximalLeapLength = (new THREE.Vector3).subVectors(
                                        (new THREE.Vector3).fromArray(leapHand.fingers[2].pipPosition),
                                        (new THREE.Vector3).fromArray(leapHand.fingers[2].mcpPosition)
                                      ).length();
    const middleProximalMeshLength = handMesh.fingers[2].position.length();
    handMesh.leapScale = middleProximalLeapLength / middleProximalMeshLength;
    return handMesh.scale.set(handMesh.leapScale, handMesh.leapScale, handMesh.leapScale);
  };
  return handMesh;
}

// Based on leap.rigged-hand-0.1.7#getMesh function.
function getMesh(riggedHand, leapHand) {
  const meshes = spareMeshes[leapHand.type];
  if (meshes.length > 0) {
    return meshes.pop();
  } else {
    const JSON = rigs[leapHand.type];
    return createMesh(riggedHand, JSON);
  }
}

// Based on leap.rigged-hand-0.1.7#addMesh function.
function addMesh(riggedHand, leapHand) {
  const handMesh = getMesh(riggedHand, leapHand);
  handMesh._leapData = leapHand;
  riggedHand.scope.parent.add(handMesh);
  const palm = handMesh.children[0];
  palm.worldUp = new THREE.Vector3;
  palm.positionLeap = new THREE.Vector3;
  handMesh.fingers.forEach(function (rigFinger) {
    rigFinger.pip = rigFinger.children[0];
    rigFinger.dip = rigFinger.pip.children[0];
    rigFinger.tip = rigFinger.dip.children[0];
    rigFinger.worldQuaternion = new THREE.Quaternion;
    rigFinger.pip.worldQuaternion = new THREE.Quaternion;
    rigFinger.dip.worldQuaternion = new THREE.Quaternion;
    rigFinger.worldAxis = new THREE.Vector3;
    rigFinger.pip.worldAxis = new THREE.Vector3;
    rigFinger.dip.worldAxis = new THREE.Vector3;
    rigFinger.worldDirection = new THREE.Vector3;
    rigFinger.pip.worldDirection = new THREE.Vector3;
    rigFinger.dip.worldDirection = new THREE.Vector3;
    rigFinger.worldUp = new THREE.Vector3;
    rigFinger.pip.worldUp = new THREE.Vector3;
    rigFinger.dip.worldUp = new THREE.Vector3;
    rigFinger.positionLeap = new THREE.Vector3;
    rigFinger.pip.positionLeap = new THREE.Vector3;
    rigFinger.dip.positionLeap = new THREE.Vector3;
    rigFinger.tip.positionLeap = new THREE.Vector3;
  });
  palm.worldDirection = new THREE.Vector3;
  palm.worldQuaternion = handMesh.quaternion;
  return handMesh;
}

function setHandStyle(handMesh) {
  handMesh.material.opacity = 0.65;
  handMesh.material.transparent = true;
}

// Based on leap.rigged-hand-0.1.7 deviceController.on('frame') handler that setups correct hand model positions.
export function setupPhantomHand(riggedHand, handMesh, leapHand) {
  leapHand.fingers = leapHand.fingers.sort(function (a, b) {
    return a.id - b.id;
  });
  const palm = handMesh.children[0];
  handMesh.scaleFromHand(leapHand);
  palm.positionLeap.fromArray(leapHand.palmPosition);
  palm.children.forEach(function (mcp, i) {
    mcp.positionLeap.fromArray(leapHand.fingers[i].mcpPosition);
    mcp.pip.positionLeap.fromArray(leapHand.fingers[i].pipPosition);
    mcp.dip.positionLeap.fromArray(leapHand.fingers[i].dipPosition);
    mcp.tip.positionLeap.fromArray(leapHand.fingers[i].tipPosition);
  });
  palm.worldDirection.fromArray(leapHand.direction);
  palm.up.fromArray(leapHand.palmNormal).multiplyScalar(-1);
  palm.worldUp.fromArray(leapHand.palmNormal).multiplyScalar(-1);
  handMesh.positionRaw.fromArray(leapHand.palmPosition);
  handMesh.position.copy(handMesh.positionRaw).multiplyScalar(riggedHand.scope.positionScale);
  handMesh.matrix.lookAt(palm.worldDirection, new THREE.Vector3(0, 0, 0), palm.up);
  palm.worldQuaternion.setFromRotationMatrix(handMesh.matrix);
  palm.children.forEach(function (mcp) {
    mcp.traverse(function (bone) {
      if (bone.children[0]) {
        bone.worldDirection.subVectors(bone.children[0].positionLeap, bone.positionLeap).normalize();
        return bone.positionFromWorld(bone.children[0].positionLeap, bone.positionLeap);
      }
    });
  });
}

// Adds phantom hand to the rigged hands view.
export function addPhantomHand(riggedHand, leapHandDesc) {
  const mesh = addMesh(riggedHand, leapHandDesc);
  setupPhantomHand(riggedHand, mesh, leapHandDesc);
  setHandStyle(mesh);
  return mesh;
}

const DEF_FOLLOW_OPTIONS = {
  xOffset: 0,
  yOffset: 0,
  zOffset: 0
};
// Accepts phantom hand mesh and options. Makes sure that phantom hand follows the real hand position.
// Options can be used to bind phantom hand to left or right hand and provide some x/y/z offset.
export function followRealHand(deviceController, riggedHand, handMesh, options = {}) {
  const opts = extend({}, DEF_FOLLOW_OPTIONS, options);
  const type = handMesh._leapData.type;
  if (handMesh._leapFollowHandler) {
    deviceController.removeListener('frame', handMesh._leapFollowHandler);
  }
  const handler = function(frame) {
    const hands = frame.hands;
    const hand = hands[0] && hands[0].type === type ? hands[0] : (hands[1] && hands[1].type === type ? hands[1] : null);
    if (hand) {
      handMesh.positionRaw.fromArray(hand.palmPosition);
      handMesh.positionRaw.x += opts.xOffset || 0;
      handMesh.positionRaw.y += opts.yOffset || 0;
      handMesh.positionRaw.z += opts.zOffset || 0;
      handMesh.position.copy(handMesh.positionRaw).multiplyScalar(riggedHand.scope.positionScale);
      riggedHand.scope.renderFn();
    }
  };
  deviceController.on('frame', handler);
  // Save handler reference so we can clean it up later.
  handMesh._leapFollowHandler = handler;
}

// Based on leap.rigged-hand-0.1.7#removeMesh function.
export function removePhantomHand(deviceController, riggedHand, handMesh) {
  riggedHand.scope.parent.remove(handMesh);
  spareMeshes[handMesh._leapData.type].push(handMesh);
  if (handMesh._leapFollowHandler) {
    deviceController.removeListener('frame', handMesh._leapFollowHandler);
    handMesh._leapFollowHandler = null;
  }
}
