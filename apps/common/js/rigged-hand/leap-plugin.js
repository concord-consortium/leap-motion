import riggedHand from './rigged-hand';
import 'leapjs-plugins';
import 'leapjs-plugins/main/version-check/leap.version-check';

export default function leapRiggedHand(controller, scope = {}) {
  controller.use('handHold');
  controller.use('handEntry');
  controller.use('versionCheck', {requiredProtocolVersion: 6});

  const rHand = riggedHand(scope);
  controller.on('handFound', rHand.callbacks.addMesh);
  controller.on('handLost', rHand.callbacks.removeMesh);
  controller.on('frame', rHand.callbacks.update);

  return rHand;
}
