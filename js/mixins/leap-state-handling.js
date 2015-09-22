// States is a hash object with states definition, for example:
// {
//   'initial': {
//      nextState: function (frame, data) {
//        // Optional callback executed when state is reached and processed.
//        // It should return either name of the next state (string), object with name and data that should be passed
//        // to the next state or null otherwise.
//        // 'frame' argument is a frame object provided by Leap API, 'data' is provided by previous state (can be undefined).
//        if (frame.hands.length === 0) return null;
//        if (frame.hands.length === 1) return 'one-hand-detected';
//        if (frame.hands.length === 0) return {stateId: 'two-hands-detected', data: {someData: 123}};
//      },
//      action: function (frame, data) {
//        // Optional callback executed when state is considered to be the final one in the current iteration.
//        // In practice it means that state is reached and its 'nextState' function isn't defined or returns null.
//      },
//    },
//    'one-hand-detected': {
//      (...)
//    },
//    'two-hands-detected': {
//      (...)
//    }
// },
//
// 'initial' state is always required.
import Leap from 'leapjs';

export default {
  getInitialState: function (props) {
    return {
      leapState: 'initial'
    };
  },

  componentDidMount: function () {
    Leap.loop(function (frame) {
      this.handleLeapState('initial', frame);
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
