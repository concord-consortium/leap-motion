(function () {
  // Module object:
  var avg = {};
  // Data:
  var data = {};
  var timestamp = {}; // in ms

  avg.FREQ_MIN_COUNT = 3;
  avg.FREQ_MIN_TIME = 1000;

  // Adds 'sample' to 'id' set, saves current time and makes sure that length of the set is <= 'limit'.
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

  // Clears 'id' set.
  avg.clear = function (id) {
    if (data[id]) {
      data[id].length = 0;
      timestamp[id].length = 0;
    }
  };

  // Returns average of all sample values from 'id' set.
  avg.getAvg = function (id) {
    var d = data[id];
    var len = d.length;
    var sum = 0;
    for (var i = 0; i < len; i++) {
      sum += d[i];
    }
    return sum / len;
  };

  // Returns "frequency" based on samples from 'id' set if data looks like a wave.
  // 'minAmplitude' describes minimal amplitude that is required to treat a group of points as a wave. It should be
  // used to filter out a noise. Frequency is based on the last three waves (avg.FREQ_MIN_COUNT). If there are not enough
  // samples or waves, 0 is returned. Also, if data is flat during the most recent second, 0 is returned automatically
  // (it usually means that motion has stopped).
  // Note it's a simple heuristic which is designed to work fast and good enough for given application.
  avg.getFreq = function (id, minAmplitude) {
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
      // Look for local minimum, but also make sure that the amplitude is big enough.
      if (d[i] > d[i + 1] && d[i + 1] <= d[i + 2] && (max - d[i + 1]) >= minAmplitude) {
        if (lastMin !== null) {
          // Wave found, save its period and increase count value.
          sum += lastMin - t[i + 1];
          count += 1;
          if ((t[0] - t[i]) > avg.FREQ_MIN_TIME && count >= avg.FREQ_MIN_COUNT) {
            // 1000 divided by average wave period, so we return value in Hertz (Hz).
            return 1000 / (sum / count); // Hz
          }
        }
        lastMin = t[i + 1];
        // Reset max!
        max = d[i + 1];
      }
      // Additional check - detects when there was no movement during 1 second.
      globalMin = Math.min(globalMin, d[i]);
      globalMax = Math.max(globalMax, d[i]);
      if ((t[0] - t[i]) > avg.FREQ_MIN_TIME && (globalMax - globalMin) < minAmplitude) {
        return 0;
      }
    }
    // Not enough samples or difference between max and min is too small (so we assume it's a noise).
    return 0;
  };

  avg.getFreqFromVel = function (id, minAmplitude, minTime, minCount) {
    if (!minTime) minTime = avg.FREQ_MIN_TIME;
    if (!minCount) minCount = avg.FREQ_MIN_COUNT;
    var d = data[id];
    var t = timestamp[id];
    var len = d.length;
    var sum = 0;
    var count = 0;
    var lastMin = null;
    var max = -Infinity;
    var globalMin = Infinity;
    var globalMax = -Infinity;
    for (var i = 0; i < len - 1; i++) {
      max = Math.max(max, d[i]);
      // Look for the sign change.
      if (d[i] >= 0 && d[i + 1] < 0 && (max - d[i + 1]) > minAmplitude) {
        if (lastMin !== null) {
          // Wave found, save its period and increase count value.
          sum += lastMin - t[i + 1];
          count += 1;
          if ((t[0] - t[i]) > minTime && count >= minCount) {
            // 1000 divided by average wave period, so we return value in Hertz (Hz).
            return 1000 / (sum / count); // Hz
          }
        }
        lastMin = t[i + 1];
        // Reset max!
        max = d[i + 1];
      }
      // Additional check - detects when there was no movement during 1 second.
      globalMin = Math.min(globalMin, d[i]);
      globalMax = Math.max(globalMax, d[i]);
      if ((t[0] - t[i]) > minTime && (globalMax - globalMin) < minAmplitude) {
        return 0;
      }
    }
    // Not enough samples or difference between max and min is too small (so we assume it's a noise).
    return 0;
  };

  window.avg = avg;
})();
