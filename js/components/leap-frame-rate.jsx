import React from 'react';
import leapController from '../tools/leap-controller';
import {rollingAvg} from '../tools/avg';

const RUNNING_AVG_LEN = 20;

export default class LeapFrameRate extends React.Component {
  constructor(props) {
    super(props);
    this.fps = 60;
    this.leapFps = 0;
    this._prevTime = null;
    this._prevDOMUpdateTime = -Infinity;
    this._onFrame = this._onFrame.bind(this);
  }

  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    leapController.on('frame', this._onFrame);
    this._fpsSpan = this.refs.fps;
    this._leapFpsSpan = this.refs.leapFps;
  }

  componentWillUnmount() {
    leapController.removeListener('frame', this._onFrame);
  }

  _onFrame(frame) {
    let time = performance.now();
    if (this._prevTime) {
      let currentFps = 1000 / (time - this._prevTime);
      this.fps = rollingAvg(currentFps, this.fps, RUNNING_AVG_LEN);
    }
    this._prevTime = time;
    // Manual DOM update. Looks like an anti-pattern, but using component state
    // and render method would trigger the whole React machinery. It was too time
    // consuming. In this case a manual update seems to be justified.
    if (time - this._prevDOMUpdateTime > 500) {
      this._fpsSpan.textContent = this.fps.toFixed();
      this._leapFpsSpan.textContent = frame.currentFrameRate.toFixed();
      this._prevDOMUpdateTime = time;
    }
  }

  render() {
    return (
      <div className='leap-frame-rate'>
        <div>Frame rate: <span ref='fps'/> (<span ref='leapFps'/>)</div>
      </div>
    )
  }
}
