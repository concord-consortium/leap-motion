import React from 'react';
import leapController from '../tools/leap-controller';
import {rollingAvg} from '../tools/avg';

const RUNNING_AVG_LEN = 20;

export default class LeapFrameRate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fps: 60,
      leapFps: 0
    };
    this._prevTime = null;
    this._onFrame = this._onFrame.bind(this);
  }

  componentDidMount() {
    leapController.on('frame', this._onFrame);
  }

  componentWillUnmount() {
    leapController.removeListener('frame', this._onFrame);
  }

  _onFrame(frame) {
    let time = Date.now();
    if (this._prevTime) {
      let currentFps = 1000 / (time - this._prevTime);
      let avgFps = rollingAvg(currentFps, this.state.fps, RUNNING_AVG_LEN);
      this.setState({
        fps: avgFps.toFixed(),
        leapFps: frame.currentFrameRate.toFixed()
      });
    }
    this._prevTime = time;
  }

  render() {
    return (
      <div className='leap-frame-rate'>
        <div>Frame rate: {this.state.fps} ({this.state.leapFps})</div>
      </div>
    )
  }
}
