import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import avg from '../tools/avg';
import FistBump from '../gestures/fist-bump';
import LeapStandardInfo from './leap-standard-info.jsx';

export default class LabTemperatureTest extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  gestureDetected() {
    avg.addSample('newFreq', this.fistBump.freq, Math.round(this.props.freqAvg));
    avg.addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('max velocity avg', avg.getAvg('maxVel'), {min: 0, max: 1500, precision: 2});
    this.plotter.plot('frequency', avg.getAvg('newFreq'), {min: 0, max: 6, precision: 2});
    this.plotter.update();
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
      <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
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
