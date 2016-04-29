import leapController from '../tools/leap-controller';

// Simplified version.
// Target is expected to implement #handleLeapFrame(frame) method.
export default {
  componentDidMount: function () {
    this.leapConnect();
  },

  componentWillUnmount: function () {
    this.leapDisconnect();
  },

  leapConnect: function () {
    this._onFrameCallback = (frame) => {
      this.handleLeapFrame(this.preprocessLeapFrame(frame));
    };
    leapController.on('frame', this._onFrameCallback);
  },

  leapDisconnect: function () {
    if (this._onFrameCallback) {
      leapController.removeListener('frame', this._onFrameCallback);
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
