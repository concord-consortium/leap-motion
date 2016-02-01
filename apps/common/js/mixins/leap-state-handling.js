import leapController from '../tools/leap-controller';

const MAX_NUMBER_OF_FRAMES_TO_PROCESS_PER_ANIM_STEP = 1;
let prevFrameId = null;

export default {
  getInitialState: function (props) {
    return {
      leapState: 'initial'
    };
  },

  componentDidMount: function () {
    this.leapConnect();
  },

  componentWillUnmount: function () {
    this.leapDisconnect();
  },

  leapConnect: function () {
    this._onFrameCallback = function () {
      let lastFrame = leapController.frame(0);
      if (prevFrameId === lastFrame.id) return;
      let framesToProcess = Math.min(MAX_NUMBER_OF_FRAMES_TO_PROCESS_PER_ANIM_STEP, lastFrame.id - prevFrameId);
      while (framesToProcess > 0) {
        framesToProcess--;
        let frame = leapController.frame(framesToProcess);
        frame = this.preprocessLeapFrame(frame);
        this.handleLeapState('initial', frame);
      }
      prevFrameId = lastFrame.id;
    }.bind(this);
    leapController.on('frame', this._onFrameCallback);
  },

  leapDisconnect: function () {
    if (this._onFrameCallback) {
      leapController.removeListener('frame', this._onFrameCallback);
      this._onFrameCallback = null;
    }
  },

  handleLeapState: function (stateId, frame, data) {
    if (!stateId) return;

    let newState = this.nextLeapState && this.nextLeapState(stateId, frame, data);
    if (!newState) {
      this.setActiveState(stateId);
      if (this.action) this.action(stateId, frame, data);
      return;
    }
    if (typeof newState === 'string') {
      this.handleLeapState(newState, frame);
    } else {
      this.handleLeapState(newState.stateId, frame, newState.data);
    }
  },

  setActiveState: function (stateId) {
    if (stateId !== this.state.leapState) {
      this.setState({leapState: stateId});
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
