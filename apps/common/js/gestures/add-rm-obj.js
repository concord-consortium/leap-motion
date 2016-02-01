import avg from '../tools/avg';
import {Howl} from 'howler';
import DirectionChange from '../tools/direction-change';
import addSound from '../../sounds/add.wav'
import removeSound from '../../sounds/remove.wav'

export default class AddRmObj {
  constructor(config, callback, plotter) {
    this.config = config;
    this.callback = callback;
    this.plotter = plotter;
    // State
    this.initialPos = null;
    this.initialTime = null;
    this.isClosed = false;

    this.addSound = new Howl({
      urls: [addSound]
    });
    this.rmSound = new Howl({
      urls: [removeSound]
    });
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
    if (hand.grabStrength > config.closedGrabStrength) {
      // Closed hand.
      if (!this.isClosed) {
        this.initialPos = hand.stabilizedPalmPosition[1];
        this.initialTime = Date.now();
        this.isClosed = true;
      }
    } else {
      // Open hand.
      let posDelta = hand.stabilizedPalmPosition[1] - this.initialPos;
      let timeDelta = Date.now() - this.initialTime;
      if (this.isClosed && timeDelta < config.maxTime && posDelta > config.minAmplitude ) {
        this.rmSound.play();
        this.callback({removed: true, handType: hand.type});
      } else if (this.isClosed && timeDelta < config.maxTime && posDelta < -config.minAmplitude) {
        this.addSound.play();
        this.callback({added: true, handType: hand.type});
      }
      this.isClosed = false;
      this.initialPos = null;
    }
    this.plotter.showCanvas('one-hand-detected');
    this.plotter.plot('grab strength', hand.grabStrength);
    this.plotter.plot('hand Y pos', hand.stabilizedPalmPosition[1]);
    this.plotter.update();
    return null;
  }
}
