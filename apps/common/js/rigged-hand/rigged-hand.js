import EventEmitter from 'events';
import rigs from 'exports?rigs!../lib/leap-rigged-hand/hand_models_v1';
import THREE from 'three';

// Options include:
// parent - Required, a THREE.js scene, which the hands will be added to.
// renderer - Required, a THREE.js renderer to use.
// camera - Required, a THREE.js camera to use.

// renderFn - If provided, this will be executed on every animation frame.
//            E.g. function(){ renderer.render(scene, camera) }
// materialOptions - A hash of properties for the material, such as wireframe: true
// meshOptions - A hash of properties for the hand meshes, such as castShadow: true
// dotsMode - shows a dot for every actual joint position, for comparison against the mesh calculations

// http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
if (!THREE.Quaternion.prototype.setFromVectors) {
  THREE.Quaternion.prototype.setFromVectors = function(a, b){
    let axis = (new THREE.Vector3).crossVectors(a, b);
    this.set(axis.x, axis.y, axis.z, 1 + a.dot(b));
    this.normalize();
    return this;
  };
}

if (!THREE.Bone.prototype.positionFromWorld) {
  // Set's the bones quaternion
  THREE.Bone.prototype.positionFromWorld = function(eye, target) {
    let directionDotParentDirection = this.worldDirection.dot(this.parent.worldDirection);
    let angle = Math.acos(directionDotParentDirection);
    this.worldAxis.crossVectors(this.parent.worldDirection, this.worldDirection).normalize();
    // http://en.wikipedia.org/wiki/Rodrigues'_rotation_formula
    // v = palmNormal = parentUp
    // k = rotation axis = worldAxis
    this.worldUp.set(0,0,0)
    .add(this.parent.worldUp.clone().multiplyScalar(directionDotParentDirection))
    .add((new THREE.Vector3).crossVectors(this.worldAxis, this.parent.worldUp).multiplyScalar(Math.sin(angle)))
    .add(this.worldAxis.clone().multiplyScalar(this.worldAxis.dot(this.parent.worldUp) * (1 - directionDotParentDirection)))
    .normalize();

    this.matrix.lookAt(eye, target, this.worldUp);
    this.worldQuaternion.setFromRotationMatrix( this.matrix );
    // Set this quaternion to be only the local change:
    this.quaternion.copy(this.parent.worldQuaternion).inverse().multiply(this.worldQuaternion);
    return this;
  };
}

export default function riggedHand(scope = {}) {
  const dispatch = new EventEmitter();

  // this allow the hand to move disproportionately to its size.
  if (!scope.positionScale) { scope.positionScale = 1; }

  if (scope.renderFn === undefined) {
    scope.renderFn = () => scope.renderer.render(scope.parent, scope.camera);
  }

  let spareMeshes = {
    left: [],
    right: []
  };

  // converts a ThreeJS JSON blob in to a mesh
  let createMesh = function(JSON){
    // note: this causes a good 90ms pause on first run
    // it appears as if mesh.clone does not clone material and geometry, so at this point we refrain from doing so
    // see THREE.SkinnedMesh.prototype.clone
    // instead, we call createMesh right off, to have the results "cached"
    let data = (new THREE.JSONLoader).parse(JSON);
    data.materials[0].skinning = true;
    data.materials[0].transparent = true;
    data.materials[0].opacity = 0.7;
    data.materials[0].emissive.setHex(0x888888);

    data.materials[0].vertexColors = THREE.VertexColors;
    data.materials[0].depthTest = true;

    Object.assign(data.materials[0], scope.materialOptions);
    Object.assign(data.geometry,     scope.geometryOptions);
    let handMesh = new THREE.SkinnedMesh(data.geometry, data.materials[0]);
    handMesh.positionRaw = new THREE.Vector3;
    handMesh.fingers = handMesh.children[0].children;
    handMesh.castShadow = true;

    // Re-create the skin index on bones in a manner which will be accessible later
    handMesh.bonesBySkinIndex = {};
    let i = 0;
    handMesh.children[0].traverse(function(bone){
      bone.skinIndex = i;
      handMesh.bonesBySkinIndex[i] = bone;
      return i++;
    });

    handMesh.boneLabels = {};

    if (scope.boneLabels) {
      handMesh.traverse(function(bone){
        let label = handMesh.boneLabels[bone.id] || (handMesh.boneLabels[bone.id] = document.createElement('div'));
        label.style.position = 'absolute';
        label.style.zIndex = '10';

        label.style.color = 'white';
        label.style.fontSize = '20px';
        label.style.textShadow = '0px 0px 3px black';
        label.style.fontFamily = 'helvetica';
        label.style.textAlign = 'center';

        return (() => {
          let result = [];
          for (let attribute in scope.labelAttributes) {
            let value = scope.labelAttributes[attribute];
            result.push(label.setAttribute(attribute, value));
          }
          return result;
        })();
      });
    }

    // takes in a vec3 of leap coordinates, and converts them in to screen position,
    // based on the hand mesh position and camera position.
    // accepts optional width and height values, which default to
    handMesh.screenPosition = function(position){
      let { camera } = scope;
      console.assert(camera instanceof THREE.Camera, "screenPosition expects camera, got", camera);

      let width =  parseInt(window.getComputedStyle(scope.renderer.domElement).width,  10);
      let height = parseInt(window.getComputedStyle(scope.renderer.domElement).height, 10);
      console.assert(width && height);

      let screenPosition = new THREE.Vector3();

      if (position instanceof THREE.Vector3) {
        screenPosition.fromArray(position.toArray());
      } else {
        screenPosition.fromArray(position)
        // the palm may have its base position scaled on top of leap coordinates:
        .sub(this.positionRaw)
        .add(this.position);
      }

      screenPosition.project(camera);
      screenPosition.x = ((screenPosition.x * width) / 2) + (width / 2);
      screenPosition.y = ((screenPosition.y * height) / 2) + (height / 2);

      console.assert(!isNaN(screenPosition.x) && !isNaN(screenPosition.x), 'x/y screen position invalid');

      return screenPosition;
    };

    handMesh.scenePosition = (leapPosition, scenePosition) =>
      scenePosition.fromArray(leapPosition)
      // these two add the base offset, factoring in for positionScale
      .sub(handMesh.positionRaw)
      .add(handMesh.position)
    ;

    // Mesh scale set by comparing leap first bone length to mesh first bone length
    handMesh.scaleFromHand = function(leapHand) {
      let middleProximalLeapLength = (new THREE.Vector3).subVectors(
        (new THREE.Vector3).fromArray(leapHand.fingers[2].pipPosition),
        (new THREE.Vector3).fromArray(leapHand.fingers[2].mcpPosition)
      ).length();
      // skinnedmesh positions are relative distances to the parent bone
      let middleProximalMeshLength = handMesh.fingers[2].position.length();

      handMesh.leapScale = ( middleProximalLeapLength / middleProximalMeshLength );
      return handMesh.scale.set( handMesh.leapScale, handMesh.leapScale, handMesh.leapScale );
    };

    return handMesh;
  };

  let getMesh = function(leapHand){
    // Meshes are kept in memory after first-use, as it takes about 24ms, or two frames, to add one to the screen
    // on a good computer.
    let meshes = spareMeshes[leapHand.type];
    if (meshes.length > 0) {
      var handMesh = meshes.pop();
    } else {
      let JSON = rigs[leapHand.type];
      var handMesh = createMesh(JSON);
      handMesh.type = leapHand.type;
    }

    return handMesh;
  };

  // initialize JSONloader for speed
  createMesh(rigs['right']);

  let zeroVector = new THREE.Vector3(0,0,0);

  // for use when dotsMode = true
  scope.dots = {};
  let basicDotMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry( 2 , 1 ),
    new THREE.MeshNormalMaterial()
  );

  scope.positionDots = function(leapHand, handMesh){
    if (!scope.dotsMode) { return; }

    if (!scope.dots["palmPosition"]) {
      scope.dots["palmPosition"] = new THREE.Mesh(
        new THREE.IcosahedronGeometry( 4 , 1 ),
        new THREE.MeshNormalMaterial()
      );
      scope.parent.add(scope.dots["palmPosition"]);
    }

    handMesh.scenePosition(leapHand["palmPosition"], scope.dots["palmPosition"].position);

    return leapHand.fingers.map((leapFinger, i) =>
      (() => {
        let result = [];
        let iterable = ['carp', 'mcp', 'pip', 'dip', 'tip'];
        for (let j = 0; j < iterable.length; j++) {

          // create meshes if necessary:
          let point = iterable[j];
          if (!scope.dots[`${point}-${i}`]) {
            scope.dots[`${point}-${i}`] = basicDotMesh.clone();
            scope.parent.add(scope.dots[`${point}-${i}`]);
          }

          result.push(handMesh.scenePosition(leapFinger[`${point}Position`], scope.dots[`${point}-${i}`].position));
        }
        return result;
      })());
  };

  return {
    scope,
    on: dispatch.on.bind(dispatch),
    callbacks: {
      addMesh (leapHand) {
        let handMesh = getMesh(leapHand);

        scope.parent.add(handMesh);
        leapHand.data('riggedHand.mesh', handMesh);
        let palm = handMesh.children[0];

        if (scope.helper) {
          handMesh.helper = new THREE.SkeletonHelper( handMesh );
          scope.parent.add(handMesh.helper);
        }

        // Initialize Vectors for later use
        // actually we need the above so that position is factored in
        palm.worldUp = new THREE.Vector3;
        palm.positionLeap = new THREE.Vector3;
        for (let i = 0; i < handMesh.fingers.length; i++) {
          let rigFinger = handMesh.fingers[i];
          rigFinger.pip = rigFinger.children[0];
          rigFinger.dip = rigFinger.pip.children[0];
          rigFinger.tip = rigFinger.dip.children[0];

          rigFinger.    worldQuaternion = new THREE.Quaternion;
          rigFinger.pip.worldQuaternion = new THREE.Quaternion;
          rigFinger.dip.worldQuaternion = new THREE.Quaternion;

          rigFinger.    worldAxis       = new THREE.Vector3;
          rigFinger.pip.worldAxis       = new THREE.Vector3;
          rigFinger.dip.worldAxis       = new THREE.Vector3;

          rigFinger.    worldDirection  = new THREE.Vector3;
          rigFinger.pip.worldDirection  = new THREE.Vector3;
          rigFinger.dip.worldDirection  = new THREE.Vector3;

          rigFinger.    worldUp         = new THREE.Vector3;
          rigFinger.pip.worldUp         = new THREE.Vector3;
          rigFinger.dip.worldUp         = new THREE.Vector3;

          rigFinger.    positionLeap   = new THREE.Vector3;
          rigFinger.pip.positionLeap   = new THREE.Vector3;
          rigFinger.dip.positionLeap   = new THREE.Vector3;
          rigFinger.tip.positionLeap   = new THREE.Vector3;
        }

        palm.worldDirection  = new THREE.Vector3;
        palm.worldQuaternion = handMesh.quaternion;

        if (scope.boneLabels) {
          // start with palm
          handMesh.children[0].traverse(bone=> document.body.appendChild(handMesh.boneLabels[bone.id]));
        }

        dispatch.emit('riggedHand.meshAdded', handMesh, leapHand);
      },

      removeMesh(leapHand) {
        let handMesh = leapHand.data('riggedHand.mesh');
        leapHand.data('riggedHand.mesh', null);

        scope.parent.remove(handMesh);

        // this should really emit events for add/remove, and not be in one ugly global callback
        if (handMesh.helper) {
          scope.parent.remove(handMesh.helper);
          handMesh.helper = null;
        }

        spareMeshes[handMesh.type].push(handMesh);

        if (scope.boneLabels) {
          // start with palm
          handMesh.children[0].traverse(bone=> document.body.removeChild(handMesh.boneLabels[bone.id]));
        }

        dispatch.emit('riggedHand.meshRemoved', handMesh, leapHand);
        if (scope.renderFn) { return scope.renderFn(); }
      },

      update(frame) {
        if (scope.stats) { scope.stats.begin(); }
        for (let k = 0; k < frame.hands.length; k++) {

          // this works around a subtle bug where non-extended fingers would appear after extended ones
          let leapHand = frame.hands[k];
          leapHand.fingers.sort((a, b) => a.id - b.id);
          let handMesh = leapHand.data('riggedHand.mesh');
          let palm = handMesh.children[0];

          handMesh.scaleFromHand(leapHand);

          palm.positionLeap.fromArray(leapHand.palmPosition);

          if (leapHand.fingers.length > 0) {
            // wrist -> mcp -> pip -> dip -> tip
            for (var i = 0; i < palm.children.length; i++) {
              var mcp = palm.children[i];
              mcp.positionLeap.fromArray(leapHand.fingers[i].mcpPosition);
              mcp.pip.positionLeap.fromArray(leapHand.fingers[i].pipPosition);
              mcp.dip.positionLeap.fromArray(leapHand.fingers[i].dipPosition);
              mcp.tip.positionLeap.fromArray(leapHand.fingers[i].tipPosition);
            }
          }

          // set heading on palm so that finger.parent can access
          palm.worldDirection.fromArray(leapHand.direction);
          palm.up.fromArray(leapHand.palmNormal).multiplyScalar(-1);
          palm.worldUp.fromArray(leapHand.palmNormal).multiplyScalar(-1);

          // hand mesh (root is where) is set to the palm position
          // this should mean it would move in sync with a fixed offset
          handMesh.positionRaw.fromArray(leapHand.palmPosition);
          handMesh.position.copy(handMesh.positionRaw).multiplyScalar(scope.positionScale);

          handMesh.matrix.lookAt(palm.worldDirection, zeroVector, palm.up);

          // set worldQuaternion before using it to position fingers (threejs updates handMesh.quaternion, but only too late)
          palm.worldQuaternion.setFromRotationMatrix( handMesh.matrix );

          for (let i1 = 0; i1 < palm.children.length; i1++) {
            var mcp = palm.children[i1];
            mcp.traverse(function(bone){
              if (bone.children[0]) {
                bone.worldDirection.subVectors(bone.children[0].positionLeap, bone.positionLeap).normalize();
                return bone.positionFromWorld(bone.children[0].positionLeap, bone.positionLeap);
              }
            });
          }

          if (handMesh.helper) {
            handMesh.helper.update();
          }

          scope.positionDots(leapHand, handMesh);


          if (scope.boneLabels) {
            palm.traverse(function(bone){
              // the condition here is necessary in case scope.boneLabels is set while a hand is in the frame
              let element;
              if (element = handMesh.boneLabels[bone.id]) {
                let screenPosition = handMesh.screenPosition(bone.positionLeap, scope.camera);
                element.style.left = `${screenPosition.x}px`;
                element.style.bottom = `${screenPosition.y}px`;
                return element.innerHTML = scope.boneLabels(bone, leapHand) || '';
              }
            });
          }

          if (scope.boneColors) {
            let { geometry } = handMesh;
            // H.  S controlled by weights, Lightness constant.
            let boneColors = {};

            var i = 0;
            while (i < geometry.vertices.length) {
              // 0-index at palm id
              // boneColors must return an array with [hue, saturation, lightness]
              if (!boneColors[geometry.skinIndices[i].x]) { boneColors[geometry.skinIndices[i].x] = (scope.boneColors(handMesh.bonesBySkinIndex[geometry.skinIndices[i].x], leapHand) || {hue: 0, saturation: 0}); }
              if (!boneColors[geometry.skinIndices[i].y]) { boneColors[geometry.skinIndices[i].y] = (scope.boneColors(handMesh.bonesBySkinIndex[geometry.skinIndices[i].y], leapHand) || {hue: 0, saturation: 0}); }
              let xBoneHSL = boneColors[geometry.skinIndices[i].x];
              let yBoneHSL = boneColors[geometry.skinIndices[i].y];
              let weights = geometry.skinWeights[i];

              // the best way to do this would be additive blending of hue based upon weights
              // currently, we just hue to whichever is set
              let hue = xBoneHSL.hue || yBoneHSL.hue;
              let lightness = xBoneHSL.lightness || yBoneHSL.lightness || 0.5;

              let saturation =
                ((xBoneHSL.saturation) * weights.x) +
                ((yBoneHSL.saturation) * weights.y);


              if (!geometry.colors[i]) { geometry.colors[i] = new THREE.Color(); }
              geometry.colors[i].setHSL(hue, saturation, lightness);
              i++;
            }
            geometry.colorsNeedUpdate = true;

            // copy vertex colors to the face
            let faceIndices = 'abc';
            for (let j1 = 0; j1 < geometry.faces.length; j1++) {
              let face = geometry.faces[j1];
              let j = 0;
              while (j < 3) {
                face.vertexColors[j] = geometry.colors[face[faceIndices[j]]];
                j++;
              }
            }
          }
        }

        if (scope.renderFn) { scope.renderFn(); }
        if (scope.stats) { return scope.stats.end(); }
      }
    }
  };
}