(function () {
  var DEFAULT_OPTIONS = {height: '150px'};
  var DEFAULT_PLOT_OPTIONS = {precision: 2};
  // Wrapper around LeapDataPlotter:
  // http://leapmotion.github.io/leapjs-plugins/utils/data-plotter/
  // The main difference is that it handles multiple instances in an easy way.
  function Plotter(options) {
    this._options = $.extend({}, DEFAULT_OPTIONS, options);
    this._element = this._options.el;
    this._$canvas = {};
    this._instance = {};
    this._activeInstance = null;
    this._enabled = true;
  }

  Plotter.prototype.setEnabled = function (v) {
    this._enabled = v;
    if (!v) {
      for (var id in this._instance) {
        if (this._instance.hasOwnProperty(id)) {
          this._$canvas[id].hide();
        }
      }
      this._activeInstance = null;
    }
  };

  Plotter.prototype.showCanvas = function (canvasId) {
    if (!this._enabled || this._activeInstance === canvasId) return;
    for (var id in this._instance) {
      if (this._instance.hasOwnProperty(id)) {
        if (id !== canvasId) {
          this._$canvas[id].hide();
        } else {
          this._$canvas[id].show();
        }
      }
    }
    this._activeInstance = canvasId;
  };

  Plotter.prototype.plot = function (id, data, opts) {
    if (!this._enabled) return;
    if (!opts) {
      opts = DEFAULT_PLOT_OPTIONS;
    }
    this.getInstance(this._activeInstance).plot(id, data, opts);
  };

  Plotter.prototype.update = function () {
    if (!this._enabled) return;
    this.getInstance(this._activeInstance).update();
  };

  Plotter.prototype.getInstance = function (canvasId) {
    if (!this._instance[canvasId]) {
      this._$canvas[canvasId] = $('<canvas>')
        .attr('id', canvasId)
        .attr('height', this._options.height)
        .appendTo(this._element);
      this._instance[canvasId] = new LeapDataPlotter({el: this._$canvas[canvasId][0]});
    }
    return this._instance[canvasId];
  };

  window.Plotter = Plotter;
})();
