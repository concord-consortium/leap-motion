import riggedHand from './rigged-hand';
import { realSenseFrame2Leap, realSenseHand2Leap } from '../realsense/realsense-2-leap';

export default function realSenseRiggedHand(controller, scope = {}) {
  const rHand = riggedHand(scope);
  controller.on('handFound', function(rsHand) {
    rHand.callbacks.addMesh(realSenseHand2Leap((rsHand)));
  });
  controller.on('handLost', function(rsHand) {
    rHand.callbacks.removeMesh(realSenseHand2Leap(rsHand));
  });
  controller.on('frame', function(rsFrame) {
    rHand.callbacks.update(realSenseFrame2Leap(rsFrame));
  });
  return rHand;
}
