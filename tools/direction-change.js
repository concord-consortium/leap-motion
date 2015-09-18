(function () {
  var DEFAULT_OPTIONS = {
    bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing 60 samples per second
    minAmplitude: 10  // mm
  };

  function DirectionChange(options) {
    this.options = $.extend({}, DEFAULT_OPTIONS, options);
    this._vel = [];
    this._pos = [];
  }

  DirectionChange.prototype.addSample = function (vel, pos) {
    this._vel.unshift(vel);
    this._pos.unshift(pos);
    if (this._vel.length > this.options.bufferLength) {
      this._vel.length = this.options.bufferLength;
      this._pos.length = this.options.bufferLength;
    }
    this._check();
  };

  DirectionChange.prototype._check = function () {
    var v = this._vel;
    var p = this._pos;
    var len = v.length;
    var minAmp = this.options.minAmplitude;
    var signChangeCount = 0;
    var initialPos = p[0];
    var initialAmp = 0;
    var currentAmp = 0;
    var maxAmp = -Infinity;
    for (var i = 0; i < len - 1; i++) {
      this._maxVel = Math.max(this._maxVel, Math.abs(v[i]));
      currentAmp = Math.abs(initialPos - p[i]);
      maxAmp = Math.max(maxAmp, currentAmp);
      if (currentAmp >= minAmp && (initialAmp >= minAmp || i > len / 2) && signChangeCount % 2 === 1) {
        this._directionChanged();
        return;
      }
      if (Math.sign(v[i]) !== Math.sign(v[i + 1])) {
        if (signChangeCount === 0) {
          initialAmp = currentAmp;
        }
        signChangeCount += 1;
        initialPos = p[i + 1];
      }
    }
    if (len === this.options.bufferLength && maxAmp < minAmp) {
      this._stopped();
    }
  };

  DirectionChange.prototype._directionChanged = function () {

    if (this.options.onDirChange) {
      this.options.onDirChange(this._maxVel);
    }
    this._vel.length = 0;
    this._pos.length = 0;
    this._maxVel = -Infinity;
  };

  DirectionChange.prototype._stopped = function () {
    if (this.options.onStop) {
      this.options.onStop();
    }
  };

  window.DirectionChange = DirectionChange;
})();
