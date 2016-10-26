import rsController from './controller';
import EventEmitter from 'events';
import {realSenseHand2Leap, realSenseFrame2Leap} from './realsense-2-leap';

// Translates RealSense data into Leap Motion format.
class LeapAdaptor extends EventEmitter {
  constructor(rsController) {
    super();
    this.controller = rsController;
    this.controller.on('frame', frame => {
      const leapFrame = realSenseFrame2Leap(frame);
      leapFrame.rsFrame = frame;
      this.emit('frame', leapFrame);
    });
    this.controller.on('handFound', hand => {
      const leapHand = realSenseHand2Leap(hand);
      leapHand.rsHand = hand;
      this.emit('handFound', leapHand);
    });
    this.controller.on('handLost', hand => {
      const leapHand = realSenseHand2Leap(hand);
      leapHand.rsHand = hand;
      this.emit('handLost', leapHand);
    });
  }

  init() {
    this.controller.init();
  }
}

// Allow only one instance (singleton).
const leapAdaptor = new LeapAdaptor(rsController);
export default leapAdaptor;
