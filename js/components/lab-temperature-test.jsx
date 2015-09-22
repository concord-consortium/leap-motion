import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import leapFps from '../tools/leap-fps';
import avg from '../tools/avg';
import FistBump from '../gestures/fist-bump';
import Plotter from './plotter.jsx';
import LeapHandsView from './leap-hands-view.jsx';

export default class LabTemperatureTest extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.refs.plotter);
  }

  gestureDetected() {
    avg.addSample('newFreq', this.fistBump.freq, Math.round(this.props.freqAvg));
    avg.addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
    this.refs.plotter.showCanvas('gesture-detected');
    this.refs.plotter.plot('frame rate', leapFps(), {min: 0, max: 130, precision: 2});
    this.refs.plotter.plot('max velocity avg', avg.getAvg('maxVel'), {min: 0, max: 1500, precision: 2});
    this.refs.plotter.plot('frequency', avg.getAvg('newFreq'), {min: 0, max: 6, precision: 2});
    this.refs.plotter.update();
  }

  nextLeapState(stateId, frame, data) {
    return this.fistBump.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep your hands steady above the Leap device.';
      case 'twoHandsDetected':
        return 'Close one fist and twist the other hand.';
      case 'gestureDetected':
        return 'Move your closed fist towards open palm and back rapidly.';
    }
  }

  render() {
    return (
      <div>
        <div className='state-and-plotter'>
          <div className='state-msg'>{ this.getStateMsg() }</div>
          <Plotter ref='plotter'/>
        </div>
        <LeapHandsView/>
      </div>
    )
  }
}

LabTemperatureTest.defaultProps = {
  maxVelAvg: 120,
  freqAvg: 120,
  handBumpConfig: {
    closedGrabStrength: 0.4,
    openGrabStrength: 0.7,
    handTwistTolerance: 0.7,
    minAmplitude: 5
  }
};

reactMixin.onClass(LabTemperatureTest, leapStateHandling);
