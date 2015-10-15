export default class SunrayAngle {
  constructor(callback, plotter) {
    this.callback = callback;
    this.plotter = plotter;
  }

  nextLeapState(stateId, frame, data) {
    let stateFuncName = 'state_' + stateId;
    return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
  }

  // State definitions:

  state_initial(frame, data) {
    if (frame.hands.length === 1) {
      return 'oneHandDetected';
    }
    // Hide debug data.
    this.plotter.showCanvas(null);
    return null;
  }

  state_oneHandDetected(frame, data) {
    let config = this.config;
    let hand = frame.hands[0];
    let angle = hand.roll() * 180 / Math.PI;
    // Limit angle to [0, 180] range and do some conversions so it's matching angle provided by Seasons model.
    if (hand.type === 'left') {
      if (angle < 0 && angle > -90) {
        angle = 0;
      } else if (angle <= -90) {
        angle = 180;
      }
    } else if (hand.type === 'right') {
      angle += 180;
      if (angle > 180 && angle < 270) {
        angle = 180;
      } else if (angle >= 270) {
        angle = 0;
      }
    }
    this.plotter.showCanvas('one-hand-detected');
    this.plotter.plot('angle', angle);
    this.plotter.update();

    if (this.callback) {
      this.callback(angle);
    }
    return null;
  }
}
