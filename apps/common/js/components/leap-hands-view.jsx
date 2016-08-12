import React from 'react';
import THREE from 'three';
import $ from 'jquery';
import leapController from '../tools/leap-controller';
import 'leapjs-plugins';
import 'leapjs-plugins/main/version-check/leap.version-check';
// leapjs-rigged-hand package is a total mess. Require JS file directly.
import 'imports?THREE=three!leapjs-rigged-hand/build/leap.rigged-hand-0.1.7';

const SKIN_COLOR = 0x93603F;

export default class LeapHandsView extends React.Component {
  componentDidMount() {
    const { handsOpacity } = this.props;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.refs.container.appendChild(this.renderer.domElement);
    this.initScene();

    leapController.use('riggedHand', {
      renderer: this.renderer,
      parent: this.scene,
      scene: this.scene,
      camera: this.camera,
      materialOptions: {
        opacity: handsOpacity
      }
    });
    leapController.on('riggedHand.meshAdded', function (handMesh) {
      handMesh.material.color.setHex(SKIN_COLOR);
      handMesh.material.emissive.setHex(0x000000);
      handMesh.material.ambient.setHex(SKIN_COLOR);
    });
  }
  componentWillReceiveProps(newProps) {
    this.resize();
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

  resize() {
    let $parent = $(this.renderer.domElement).parent();
    let newWidth = $parent.width();
    let newHeight = $parent.height();
    this.camera.aspect = newWidth / newHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(newWidth, newHeight);
  }

  initScene() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.width, this.height);

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 10000);
    this.camera.position.fromArray([0, 500, 400]);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
    this.pointLight.position.set(-20, 400, 0);
    this.pointLight.lookAt(new THREE.Vector3(0, 0, 0));

    this.scene.add(this.pointLight);
    this.scene.add(new THREE.AmbientLight(0x777777));
    this.scene.add(this.camera);
  }

  render() {
    const {width, height} = this.props;
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
