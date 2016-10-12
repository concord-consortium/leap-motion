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
    const { handsOpacity, positionOffset, positionScale, cameraPosition } = this.props;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.refs.container.appendChild(this.renderer.domElement);
    this.initScene(cameraPosition);
    this.handMeshes = new Set();

    leapController.use('riggedHand', {
      renderer: this.renderer,
      parent: this.scene,
      scene: this.scene,
      positionScale: positionScale,
      camera: this.camera,
      materialOptions: {
        opacity: handsOpacity
      },
      renderFn: () => {
        // Provide custom rendererFn to apply transformations to hand meshes. Theoretically position offset
        // should be supported (it's in the docs), but in practice it isn't (I've double checked that in code)...
        this.handMeshes.forEach(handMesh => {
          handMesh.position.add((new THREE.Vector3()).fromArray(positionOffset))
        });
        this.renderer.render(this.scene, this.camera);
      }
    });
    leapController.on('riggedHand.meshAdded', (handMesh) => {
      handMesh.material.color.setHex(SKIN_COLOR);
      handMesh.material.emissive.setHex(0x000000);
      handMesh.material.ambient.setHex(SKIN_COLOR);
      this.handMeshes.add(handMesh);
    });
    leapController.on('riggedHand.meshRemoved', (handMesh) => {
      this.handMeshes.delete(handMesh);
    });
  }

  componentDidUpdate(prevProps) {
    const { width, height, positionScale, cameraPosition } = this.props;
    if (width !== prevProps.width || height !== prevProps.height) {
      this.resize3DView();
    }
    const scope = leapController.plugins.riggedHand;
    if (scope) {
      scope.positionScale = positionScale;
    }
    this.camera.position.fromArray(cameraPosition);
  }

  get width() {
    return this.refs.container.clientWidth;
  }

  get height() {
    return this.refs.container.clientHeight;
  }

  resize3DView() {
    const width = this.width;
    const height = this.height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  initScene(cameraPosition) {
    const width = this.width;
    const height = this.height;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    this.camera.position.fromArray(cameraPosition);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    const pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
    pointLight.position.set(-20, 400, 0);
    pointLight.lookAt(new THREE.Vector3(0, 0, 0));

    this.scene.add(pointLight);
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
  // Following props are not dynamic, you can change them only while initializing hands view.
  handsOpacity: 0.85,
  positionScale: 1,
  positionOffset: [0, 0, 0],
  cameraPosition: [0, 500, 400]
};
