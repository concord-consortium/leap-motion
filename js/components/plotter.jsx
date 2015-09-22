import React from 'react';
import $ from 'jquery';
import LeapDataPlotter from '../tools/leap-data-plotter';

const DEFAULT_PLOT_OPTIONS = {
  precision: 2
};

export default class Plotter extends React.Component {
  constructor(props) {
    super(props);
    this._$canvas = {};
    this._instance = {};
    this._activeInstance = null;
    this._enabled = true;
  }

  shouldComponentUpdate() {
    return false;
  }

  setEnabled(v) {
    this._enabled = v;
    if (!v) {
      for (var id in this._instance) {
        if (this._instance.hasOwnProperty(id)) {
          this._$canvas[id].hide();
        }
      }
      this._activeInstance = null;
    }
  }

  showCanvas(canvasId) {
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
  }

  plot(id, data, opts) {
    if (!this._enabled) return;
    if (!opts) {
      opts = DEFAULT_PLOT_OPTIONS;
    }
    this.getInstance(this._activeInstance).plot(id, data, opts);
  }

  update() {
    if (!this._enabled) return;
    this.getInstance(this._activeInstance).update();
  }

  getInstance(canvasId) {
    if (!this._instance[canvasId]) {
      this._$canvas[canvasId] = $('<canvas>')
        .attr('id', canvasId)
        .attr('height', this.props.height)
        .appendTo(React.findDOMNode(this.refs.container));
      this._instance[canvasId] = new LeapDataPlotter({el: this._$canvas[canvasId][0]});
    }
    return this._instance[canvasId];
  }

  render() {
    return (
      <div className='plotter' ref='container'></div>
    )
  }
}

Plotter.defaultProps = {
  height: '150px'
};