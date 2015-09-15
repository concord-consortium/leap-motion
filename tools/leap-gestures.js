(function () {
  // States is a hash object with states definition, for example:
  // {
  //   'initial': {
  //      info: 'Please keep your hands steady above the Leap device.',
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
  // 'initial' state is always required. 'info' messages are displayed in DOM element that has 'state-msg' ID.

  function processLeapGestures(states) {
    function handleState(stateId, frame, data) {
      if (!stateId) return;
      var state = states[stateId];
      if (!state) throw new Error('State ' + stateId + ' is not defined');

      var newState = state.nextState && state.nextState(frame, data);
      if (!newState) {
        setActiveState(state);
        if (state.action) state.action(frame, data);
        return;
      }
      if (typeof newState === 'string') {
        handleState(newState, frame);
      } else {
        handleState(newState.stateId, frame, newState.data);
      }
    }

    function setActiveState(state) {
      $('#state-msg').html(state.info);
    }

    Leap.loop(function (frame) {
      handleState('initial', frame);
    });
  }

  window.processLeapGestures = processLeapGestures;
})();
