import leapController from '../tools/leap-controller';
import rsLeapAdaptor from '../realsense/leap-adaptor';
import getURLParam from '../tools/get-url-param';

const device = getURLParam('device') || 'leap';
const controller = device === 'leap' ? leapController : rsLeapAdaptor;

// Simplified version.
// Target is expected to implement #handleLeapFrame(frame) method.
export default {
  componentDidMount: function () {
    this.deviceConnect();
  },

  componentWillUnmount: function () {
    this.deviceDisconnect();
  },

  deviceConnect: function () {
    this._onFrameCallback = (frame) => {
      this.handleLeapFrame(this.preprocessLeapFrame(frame));
    };
    if (device === 'realsense') {
      controller.init();
    }
    controller.on('frame', this._onFrameCallback);
  },

  deviceDisconnect: function () {
    if (this._onFrameCallback) {
      controller.removeListener('frame', this._onFrameCallback);
      this._onFrameCallback = null;
    }
  },

  // Try to workaround some common issues observed while playing with Leap API.
  preprocessLeapFrame: function (frame) {
    if (frame.hands.length === 2 && frame.hands[0].type === frame.hands[1].type) {
      // Both hands have the same type (left or right), makes no sense, but it's quite common issue.
      // Assume that the hand which is on the left side is left and the other one is right.
      if (frame.hands[0].palmPosition[0] < frame.hands[1].palmPosition[0]) {
        frame.hands[0].type = 'left';
        frame.hands[1].type = 'right';
      } else {
        frame.hands[0].type = 'right';
        frame.hands[1].type = 'left';
      }
    }
    return frame;
  }
}
