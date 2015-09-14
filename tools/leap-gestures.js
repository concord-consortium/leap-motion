(function () {
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
