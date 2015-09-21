import avg from '../tools/avg';
import {Howl} from 'howler';
import DirectionChange from '../tools/direction-change';

export default class LeapTemperatureTestHelper {
  constructor(config, plotter) {
    this.config = config;
    this.plotter = plotter;
    this.lastDirChange = null;
    this.freq = 0;
    this.maxVel = 0;
    this.hand = null;
    let sound = new Howl({
      urls: ['tap.wav']
    });
    this.freqCalc = new DirectionChange({
      minAmplitude: this.config.minAmplitude,
      onDirChange: function (data) {
        var timestamp = Date.now();
        if (this.lastDirChange) {
          this.freq = 0.5 * 1000 / (timestamp - this.lastDirChange);
          this.maxVel = data.maxVelocity;
        }
        this.lastDirChange = timestamp;
        if (this.hand && ((this.hand.type === 'right' && data.type === DirectionChange.LEFT_TO_RIGHT) ||
          (this.hand.type === 'left' && data.type === DirectionChange.RIGHT_TO_LEFT))) {
          // Play sound effect!
          sound.play();
        }
      }.bind(this),
      onStop: function () {
        this.lastDirChange = Date.now();
        this.freq = 0;
        this.maxVel = 0;
      }.bind(this)
    });
  }

  nextLeapState(stateId, frame, data) {
    let config = this.config;
    
    switch(stateId) {
      case 'initial':
        if (frame.hands.length === 2) {
          return 'two-hands-detected';
        }
        // Hide debug data.
        this.plotter.showCanvas(null);
        return null;

      case 'two-hands-detected':
      function condition(closedHandIdx, openHandIdx) {
        var closedHand = frame.hands[closedHandIdx];
        var openHand = frame.hands[openHandIdx];
        if (closedHand.grabStrength > config.closedGrabStrength && openHand.grabStrength < config.openGrabStrength &&
            Math.abs(Math.abs(openHand.roll()) - Math.PI / 2) < config.handTwistTolerance) {
          return true;
        }
        return false;
      }
        if (condition(0, 1)) {
          return {stateId: 'gesture-detected', data: {closedHand: frame.hands[0], openHand: frame.hands[1]}};
        } else if (condition(1, 0)) {
          return {stateId: 'gesture-detected', data: {closedHand: frame.hands[1], openHand: frame.hands[0]}};
        } else {
          this.plotter.showCanvas('two-hands-detected');
          this.plotter.plot('this.hand 0 roll', frame.hands[0].roll());
          this.plotter.plot('this.hand 1 grab strength', frame.hands[1].grabStrength);
          this.plotter.update()
        }
        return null;

      case 'gesture-detected':
        this.plotter.showCanvas('gesture-detected');

        this.hand = data.closedHand;

        this.plotter.plot('leap frame rate', frame.currentFrameRate, {min: 0, max: 100, precision: 2});

        avg.addSample('fistXVel', this.hand.palmVelocity[0], 6);
        this.freqCalc.addSample(avg.getAvg('fistXVel'), this.hand.palmPosition[0]);
        avg.addSample('newFreq', this.freq, Math.round(config.freqAvg));
        avg.addSample('this.maxVel', this.maxVel, Math.round(config.maxVelAvg));
        this.plotter.plot('max velocity avg', avg.getAvg('this.maxVel'), {min: 0, max: 1500, precision: 2});
        this.plotter.plot('frequency (new alg)', avg.getAvg('newFreq'), {min: 0, max: 6, precision: 2});

        this.plotter.update();

        return null;
    }
  }
}
