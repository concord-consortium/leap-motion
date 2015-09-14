(function () {
  // Module object:
  var avg = {};
  // Data:
  var data = {};
  var timestamp = {}; // in ms

  avg.addSample = function (id, sample, limit) {
    if (!data[id]) {
      data[id] = [];
      timestamp[id] = [];
    }
    var d = data[id];
    var t = timestamp[id];

    d.unshift(sample);
    t.unshift(Date.now());

    if (!limit) limit = 100;
    if (d.length > limit) {
      d.length = limit;
      t.length = limit;
    }
  };

  avg.getAvg = function (id) {
    var d = data[id];
    var len = d.length;
    var sum = 0;
    for (var i = 0; i < len; i++) {
      sum += d[i];
    }
    return sum / len;
  };

  avg.getFreq = function (id, minAmplitude, minCount) {
    if (minCount === undefined) minCount = 1;
    var d = data[id];
    var t = timestamp[id];
    var len = d.length;
    var sum = 0;
    var count = 0;
    var lastMin = null;
    var max = -Infinity;
    var globalMin = Infinity;
    var globalMax = -Infinity;
    for (var i = 0; i < len - 2; i++) {
      max = Math.max(max, d[i]);
      if (d[i] > d[i + 1] && d[i + 1] <= d[i + 2] && (max - d[i + 1]) >= minAmplitude) {
        if (lastMin !== null) {
          sum += lastMin - t[i + 1];
          count += 1;
          if (count >= minCount) {
            return 1000 / (sum / count);
          }
        }
        lastMin = t[i + 1];
        max = d[i + 1];
      }

      // Additional check - detects when there was no movement during 1 second.
      globalMin = Math.min(globalMin, d[i]);
      globalMax = Math.max(globalMax, d[i]);
      if ((t[0] - t[i]) > 1000 && (globalMax - globalMin) < minAmplitude) {
        return 0;
      }
    }
    // Not enough samples or difference between max and min is too small (so we assume it's a noise).
    return 0;
  };

  window.avg = avg;
})();
