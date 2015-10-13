import leapController from '../tools/leap-controller';

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
      let framesToProcess = Math.min(1, lastFrame.id - prevFrameId);
      while (framesToProcess > 0) {
        framesToProcess--;
        this.handleLeapState('initial', leapController.frame(framesToProcess));
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
  }
}
