import {Howl} from 'howler';
import addSound from '../common/sounds/add.wav'
import removeSound from '../common/sounds/remove.wav'

const DEFAULT_OPTIONS = {
  bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
  minAmplitude: 1,
  maxTime: 110 // ms
};

export default class AddRmObjSwipe {
  constructor(config, callback, plotter) {
    this.config = config || DEFAULT_OPTIONS;
    this.callback = callback;
    this.plotter = plotter;

    this.addSound = new Howl({
      urls: [addSound]
    });
    this.rmSound = new Howl({
      urls: [removeSound]
    });

    this._yaw = [];
    this._t = [];
  }

  nextLeapState(stateId, frame, data) {
    let stateFuncName = 'state_' + stateId;
    return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
  }

  _addSample(yaw, handType) {
    this._yaw.unshift(yaw);
    this._t.unshift(performance.now());
    if (this._yaw.length > this.config.bufferLength) {
      this._yaw.length = this.config.bufferLength;
      this._t.length = this.config.bufferLength;
    }
    this._check(handType);
  }

  _check(handType) {
    let d = this._yaw;
    let len = this._yaw.length;
    for (var i = 0; i < len - 1; i++) {
      if (this._checkLeftSwipe(i)) {
        let data = {
          handType: handType
        };
        if (handType === 'right') {
          data.added = true;
          this.addSound.play();
        } else {
          data.removed = true;
          this.rmSound.play();
        }
        this.callback(data);
        this._clearBuffers();
        return;
      } else if (this._checkRightSwipe(i)) {
        let data = {
          handType: handType
        };
        if (handType === 'left') {
          data.added = true;
          this.addSound.play();
        } else {
          data.removed = true;
          this.rmSound.play();
        }
        this.callback(data);
        this._clearBuffers();
        return;
      }
    }
  }

  _checkLeftSwipe(startIdx) {
    let d = this._yaw;
    let t = this._t;
    let len = this._yaw.length;
    for (var i = startIdx; i < len - 1; i++) {
      if (d[i] > d[i + 1]) {
        return false;
      }
      if (t[startIdx] - t[i + 1] > this.config.maxTime) {
        return false;
      }
      if (d[i + 1] - d[startIdx] > this.config.minAmplitude) {
        return true;
      }
    }
    return false;
  }

  _checkRightSwipe(startIdx) {
    let d = this._yaw;
    let t = this._t;
    let len = this._yaw.length;
    for (var i = startIdx; i < len - 1; i++) {
      if (d[i] < d[i + 1]) {
        return false;
      }
      if (t[startIdx] - t[i + 1] > this.config.maxTime) {
        return false;
      }
      if (d[startIdx] - d[i + 1] > this.config.minAmplitude) {
        return true;
      }
    }
    return false;
  }

  _clearBuffers() {
    this._yaw.length = 0;
    this._t.length = 0;
  }

  // State definitions:

  state_initial(frame, data) {
    if (frame.hands.length === 1) {
      return 'oneHandDetected';
    }
    return null;
  }

  state_oneHandDetected(frame, data) {
    let hand = frame.hands[0];
    let yaw = hand.yaw();
    this._addSample(yaw, hand.type);
    this.plotter.showCanvas('one-hand-detected');
    this.plotter.plot('yaw', yaw);
    this.plotter.update();
    return null;
  }
}
