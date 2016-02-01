import React from 'react';
import LeapDataPlotter from '../tools/leap-data-plotter';

const DEFAULT_PLOT_OPTIONS = {
  precision: 2
};

export default class Plotter extends React.Component {
  constructor(props) {
    super(props);
    this._canvas = {};
    this._instance = {};
    this._activeInstance = null;
  }

  showCanvas(canvasId) {
    if (this.props.hidden || this._activeInstance === canvasId) return;
    for (var id in this._instance) {
      if (this._instance.hasOwnProperty(id)) {
        if (id !== canvasId) {
          this._canvas[id].style.display = 'none';
        } else {
          this._canvas[id].style.display = 'inline';
        }
      }
    }
    this._activeInstance = canvasId;
  }

  plot(id, data, opts) {
    if (this.props.hidden) return;
    if (!opts) {
      opts = DEFAULT_PLOT_OPTIONS;
    }
    this.getInstance(this._activeInstance).plot(id, data, opts);
  }

  update() {
    if (this.props.hidden) return;
    this.getInstance(this._activeInstance).update();
  }

  getInstance(canvasId) {
    if (!this._instance[canvasId]) {
      let canvas = document.createElement('canvas');
      canvas.setAttribute('id', canvasId);
      canvas.setAttribute('height', this.props.height);
      this.refs.container.appendChild(canvas);
      this._instance[canvasId] = new LeapDataPlotter({el: canvas});
      this._canvas[canvasId] = canvas;
    }
    return this._instance[canvasId];
  }

  render() {
    return (
      <div className='plotter' ref='container' style={{display: this.props.hidden ? 'none' : ''}}></div>
    )
  }
}

Plotter.defaultProps = {
  hidden: false,
  height: '150px'
};
