import leapController from '../tools/leap-controller';

let prevFrameId = null;

export default {
  getInitialState: function (props) {
    return {
      leapState: 'initial'
    };
  },

  componentDidMount: function () {
    leapController.on('frame', function () {
      let lastFrame = leapController.frame(0);
      if (prevFrameId === lastFrame.id) return;
      let framesToProcess = Math.min(1, lastFrame.id - prevFrameId);
      while (framesToProcess > 0) {
        framesToProcess--;
        this.handleLeapState('initial', leapController.frame(framesToProcess));
      }
      prevFrameId = lastFrame.id;
    }.bind(this));
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
    this.setState({leapState: stateId});
  }
}
