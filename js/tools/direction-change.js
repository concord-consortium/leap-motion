import $ from 'jquery';

const DEFAULT_OPTIONS = {
  bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
  minAmplitude: 20
};

class DirectionChange {
  constructor(options) {
    this.options = $.extend({}, DEFAULT_OPTIONS, options);
    this._vel = [];
    this._halfPeriodMaxVel = -Infinity;
    this._lastDirChange = null;
    // Outputs:
    this.frequency = 0;
    this.halfPeriodMaxVel = 0;
  }

  addSample(vel) {
    this._vel.unshift(vel);
    if (this._vel.length > this.options.bufferLength) {
      this._vel.length = this.options.bufferLength;
    }
    this._check();
  }

  // We assume that direction has changed when velocity changes its sign and:
  //  max velocity before the sign change is greater than options.minAmplitude
  //  AND
  //  max velocity after the sign change is greater than options.minAmplitude
  _check() {
    let v = this._vel;
    let len = v.length;
    let minAmp = this.options.minAmplitude;
    let signChangeCount = 0;
    let initialMax = -Infinity;
    let currentMax = -Infinity;
    let bufferMax = -Infinity;
    for (let i = 0; i < len; i++) {
      currentMax = Math.max(currentMax, Math.abs(v[i]));
      bufferMax = Math.max(bufferMax, currentMax);
      this._halfPeriodMaxVel = Math.max(this._halfPeriodMaxVel, currentMax);
      // Note that if the sign has changed 2 or 4 times, in fact it means it hasn't changed. That's why we test % 2.
      if (currentMax >= minAmp && initialMax >= minAmp && signChangeCount % 2 === 1) {
        this._directionChanged({
          type: v[i] > 0 ? DirectionChange.RIGHT_TO_LEFT : DirectionChange.LEFT_TO_RIGHT
        });
        return;
      }
      if (i + 1 < len) {
        if (Math.sign(v[i]) !== Math.sign(v[i + 1])) {
          if (signChangeCount === 0) {
            // Save the max velocity before the fist sign change.
            initialMax = currentMax;
          }
          signChangeCount += 1;
          currentMax = -Infinity;
        }
      }
    }
    if (len === this.options.bufferLength && bufferMax < minAmp) {
      this._stopped();
    }
  }

  _directionChanged(data) {
    let timestamp = performance.now();
    if (this._lastDirChange) {
      // Calculate outputs.
      this.frequency = 0.5 * 1000 / (timestamp - this._lastDirChange);
      this.halfPeriodMaxVel = this._halfPeriodMaxVel;
    }
    this._lastDirChange = timestamp;

    this._vel.length = 1;
    this._halfPeriodMaxVel = -Infinity;

    if (this.options.onDirChange) {
      this.options.onDirChange(data);
    }
  }

  _stopped() {
    // Calculate outputs.
    this.frequency = 0;
    this.halfPeriodMaxVel = 0;

    this._lastDirChange = performance.now();

    if (this.options.onStop) {
      this.options.onStop();
    }
  }
}

DirectionChange.LEFT_TO_RIGHT = 0;
DirectionChange.RIGHT_TO_LEFT = 1;

export default DirectionChange;
