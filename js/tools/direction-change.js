import $ from 'jquery';

const DEFAULT_OPTIONS = {
  bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
  minAmplitude: 10  // mm
};

class DirectionChange {
  constructor(options) {
    this.options = $.extend({}, DEFAULT_OPTIONS, options);
    this._vel = [];
    this._pos = [];
  }

  addSample(vel, pos) {
    this._vel.unshift(vel);
    this._pos.unshift(pos);
    if (this._vel.length > this.options.bufferLength) {
      this._vel.length = this.options.bufferLength;
      this._pos.length = this.options.bufferLength;
    }
    this._check();
  }

  // We assume that direction has changed when velocity changes its sign and:
  //  1. position diff (amplitude) before the sign change is greater than options.minAmplitude
  //  AND
  //   2a. position diff (amplitude) after the sign change is greater than options.minAmplitude
  //   OR
  //   2b. position diff (amplitude) after the sign change is smaller than options.minAmplitude AND
  //       that lasts for more that 50% of samples (it means that motion has stopped).
  _check() {
    let v = this._vel;
    let p = this._pos;
    let len = v.length;
    let minAmp = this.options.minAmplitude;
    let signChangeCount = 0;
    let initialPos = p[0];
    let initialAmp = 0;
    let currentAmp = 0;
    let maxAmp = -Infinity;
    for (let i = 0; i < len - 1; i++) {
      // Max velocity within half-period (between direction changes) is provided to options.onDirChange callback.
      this._maxVel = Math.max(this._maxVel, Math.abs(v[i]));
      currentAmp = Math.abs(initialPos - p[i]);
      maxAmp = Math.max(maxAmp, currentAmp);
      // Note that if the sign has changed 2 or 4 times, in fact it means it hasn't changed. That's why we test % 2.
      if (currentAmp >= minAmp && (initialAmp >= minAmp || i > len / 2) && signChangeCount % 2 === 1) {
        this._directionChanged({
          maxVelocity: this._maxVel,
          type: v[i] > 0 ? DirectionChange.RIGHT_TO_LEFT : DirectionChange.LEFT_TO_RIGHT
        });
        return;
      }
      if (Math.sign(v[i]) !== Math.sign(v[i + 1])) {
        if (signChangeCount === 0) {
          // Save amplitude before the fist sign change.
          initialAmp = currentAmp;
        }
        signChangeCount += 1;
        initialPos = p[i + 1];
      }
    }
    if (len === this.options.bufferLength && maxAmp < minAmp) {
      this._stopped();
    }
  }

  _directionChanged(data) {
    if (this.options.onDirChange) {
      this.options.onDirChange(data);
    }
    this._vel.length = 0;
    this._pos.length = 0;
    this._maxVel = -Infinity;
  }

  _stopped() {
    if (this.options.onStop) {
      this.options.onStop();
    }
  }
}

DirectionChange.LEFT_TO_RIGHT = 0;
DirectionChange.RIGHT_TO_LEFT = 1;

export default DirectionChange;
