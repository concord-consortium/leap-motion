import React from 'react';
import THREE from 'three';
import leapController from '../tools/leap-controller';
import realSenseController from '../realsense/controller';
import leapRiggedHand from '../rigged-hand/leap-plugin';
import realSenseRiggedHand from '../rigged-hand/realsense-plugin';
import PhantomHandsBase from '../rigged-hand/phantom-hands';

import '../../css/hands-view.less';

const SKIN_COLOR = 0x93603F;

const LEAP_CAMERA_POS = [0, 500, 400];
const REALSENSE_CAMERA_POS = [0, 0, 1000];

export default class LeapHandsView extends React.Component {
  componentDidMount() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.refs.container.appendChild(this.renderer.domElement);
    this.initScene();
    this.initRiggedHandView();
    this.initPhantomHands();
  }

  initRiggedHandView() {
    const { device, handsOpacity, positionScale, positionOffset } = this.props;
    const options = {
      renderer: this.renderer,
      parent: this.scene,
      camera: this.camera,
      positionScale: positionScale,
      materialOptions: {
        opacity: handsOpacity
      }
    };
    if (device === 'leap') {
      this.riggedHand = leapRiggedHand(leapController, options);
    } else if (device === 'realsense') {
      realSenseController.init();
      this.riggedHand = realSenseRiggedHand(realSenseController, options);
    }
    this.riggedHand.on('riggedHand.meshAdded', (handMesh) => {
      handMesh.material.color.setHex(SKIN_COLOR);
      handMesh.material.emissive.setHex(0x000000);
      handMesh.material.ambient.setHex(SKIN_COLOR);
      // Hacky. Provide custom helper to apply transformations to hand meshes. Theoretically position offset
      // should be supported (it's in the docs), but in practice it isn't (I've double checked that in code)...
      // .helper.update() is called right after the hand mesh position is updated, so we can apply additional transform.
      handMesh.helper = {
        update: () => {
          handMesh.position.add((new THREE.Vector3()).fromArray(positionOffset))
        }
      }
    });
  }

  initPhantomHands() {
    this.phantomHands = new PhantomHandsBase({
      riggedHand: this.riggedHand,
      deviceController: this.deviceController
    });
  }

  componentDidUpdate(prevProps) {
    const { width, height, positionScale, phantomHands } = this.props;
    if (width !== prevProps.width || height !== prevProps.height) {
      this.resize3DView();
    }
    if (phantomHands !== prevProps.phantomHands) {
      this.phantomHands.startAnimation(phantomHands);
    }
    this.riggedHand.scope.positionScale = positionScale;
    this.camera.position.fromArray(this.cameraPosition);
  }

  get width() {
    return this.refs.container.clientWidth;
  }

  get height() {
    return this.refs.container.clientHeight;
  }

  get cameraPosition() {
    const { device, cameraPosition } = this.props;
    if (cameraPosition) {
      // Return custom position if it's provided.
      return cameraPosition;
    }
    return device === 'leap' ? LEAP_CAMERA_POS : REALSENSE_CAMERA_POS;
  }

  get deviceController() {
    const { device } = this.props;
    return device === 'leap' ? leapController : realSenseController;
  }

  resize3DView() {
    const width = this.width;
    const height = this.height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  snapshotHand(callback) {
    this.phantomHands.snapshotHand(callback);
  }

  initScene() {
    const width = this.width;
    const height = this.height;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    this.camera.position.fromArray(this.cameraPosition);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    const pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
    pointLight.position.fromArray(this.cameraPosition);
    pointLight.lookAt(new THREE.Vector3(0, 0, 0));

    this.scene.add(pointLight);
    this.scene.add(new THREE.AmbientLight(0x777777));
    this.scene.add(this.camera);
  }

  render() {
    const {width, height, phantomHands} = this.props;
    return (
      <div className='hands-view' ref='container' style={{width, height, position: 'relative'}}>
        {phantomHands && <img src='leap.png' className='leap-img'/>}
      </div>
    );
  }
}

LeapHandsView.defaultProps = {
  device: 'leap', // or 'realsense'
  width: '100%',
  height: '100%',
  // Following props are not dynamic, you can change them only while initializing hands view.
  handsOpacity: 0.85,
  positionScale: 1,
  positionOffset: [0, 0, 0],
  cameraPosition: null, // if it's null, LEAP_CAMERA_POS or REALSENSE_CAMERA_POS will be used
  phantomHands: null
};
