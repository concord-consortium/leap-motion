export default {
  data: {},

  // Adds 'sample' to 'id' set, saves current time and makes sure that length of the set is <= 'limit'.
  addSample: function (id, sample, limit) {
    if (!this.data[id]) {
      this.data[id] = [];
    }
    var d = this.data[id];

    d.unshift(sample);

    if (!limit) limit = 100;
    if (d.length > limit) {
      d.length = limit;
    }
  },

  // Returns average of all sample values from 'id' set.
  getAvg: function (id) {
    if (!this.data[id]) return null;
    var d = this.data[id];
    var len = d.length;
    var sum = 0;
    for (var i = 0; i < len; i++) {
      sum += d[i];
    }
    return sum / len;
  },

  // Clears 'id' set.
  clear: function (id) {
    if (this.data[id]) {
      this.data[id].length = 0;
    }
  }
};
