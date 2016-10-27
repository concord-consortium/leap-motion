const MIN_GESTURE_TIME = 2500;

export default {
  getInitialState: function (props) {
    return {
      overlayActive: true
    };
  },

  componentDidMount() {
    this._gestureDetectedTimestamp = null;
    this._gestureEverDetected = false;
  },

  updateOverlayOnGestureDetected() {
    if (!this._gestureDetectedTimestamp) {
      this._gestureDetectedTimestamp = Date.now();
    }
    if (this._gestureDetectedTimestamp && Date.now() - this._gestureDetectedTimestamp > MIN_GESTURE_TIME) {
      this._gestureEverDetected = true;
      // Disable overlay after gesture has been detected for some time.
      this.setState({overlayActive: false});
    }
  },

  updateOverlayOnGestureNotDetected(numberOfHands) {
    if (numberOfHands > 0) {
      // Show overlay if user keeps his hands over the Leap.
      this.setState({overlayActive: true});
    } else if (this._gestureEverDetected) {
      // But hide it if user removes hands and gesture has been detected before.
      // This might be useful when user simply wants to watch the simulation.
      this.setState({overlayActive: false});
    }
    this._gestureDetectedTimestamp = null;
  },

  resetOverlay() {
    this._gestureDetectedTimestamp = null;
    this._gestureEverDetected = false;
    this.setState({overlayActive: true});
  }
}
