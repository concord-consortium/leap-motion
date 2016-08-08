import React from 'react';
import THREE from 'three';
import leapController from '../tools/leap-controller';
import 'leapjs-plugins';
import 'leapjs-plugins/main/version-check/leap.version-check';
// leapjs-rigged-hand package is a total mess. Require JS file directly.
import 'imports?THREE=three!leapjs-rigged-hand/build/leap.rigged-hand-0.1.7';

const SKIN_COLOR = 0x93603F;

export default class LeapHandsView extends React.Component {
  componentDidMount() {
    const { handsOpacity } = this.props;
    const renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(this.width, this.height);
    this.refs.container.appendChild(renderer.domElement);
    const threeData = this.initScene();
    leapController.use('riggedHand', {
      renderer,
      parent: threeData.scene,
      scene: threeData.scene,
      camera: threeData.camera,
      materialOptions: {
        opacity: handsOpacity
      }
    });
    leapController.on('riggedHand.meshAdded', function(handMesh) {
      handMesh.material.color.setHex(SKIN_COLOR);
      handMesh.material.emissive.setHex(0x000000);
      handMesh.material.ambient.setHex(SKIN_COLOR);
    });
  }

  shouldComponentUpdate() {
    return false;
  }

  get width() {
    return this.refs.container.clientWidth;
  }

  get height() {
    return this.refs.container.clientHeight;
  }

  initScene() {
    const scene = new THREE.Scene();
    const pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
    pointLight.position.set(-20, 400, 0);
    pointLight.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(pointLight);
    scene.add(new THREE.AmbientLight(0x777777));
    const camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 10000);
    camera.position.fromArray([0, 500, 400]);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);
    return {scene, camera};
  }

  render() {
    const { width, height } = this.props;
    return (
      <div className='hands-view' ref='container' style={{width, height}}></div>
    )
  }
}

LeapHandsView.defaultProps = {
  width: '100%',
  height: '100%',
  handsOpacity: 1
};
