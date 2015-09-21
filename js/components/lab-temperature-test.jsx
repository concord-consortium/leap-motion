import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import LabTemperatureTestHelper from './lab-temperature-test-helper';
import Plotter from './plotter.jsx';
import LeapHandsView from './leap-hands-view.jsx';

export default class LabTemperatureTest extends React.Component {
  componentDidMount() {
    this.helper = new LabTemperatureTestHelper(this.props.leapConfig, this.refs.plotter);
  }

  nextLeapState(stateId, frame, data) {
    return this.helper.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep your hands steady above the Leap device.';
      case 'two-hands-detected':
        return 'Close one fist and twist the other hand.';
      case 'gesture-detected':
        return 'Move your closed fist towards open palm and back rapidly';
    }
  }

  render() {
    return (
      <div>
        <div></div>
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
  leapConfig: {
    closedGrabStrength: 0.4,
    openGrabStrength: 0.7,
    handTwistTolerance: 0.7,
    minAmplitude: 5,
    freqAvg: 120,
    maxVelAvg: 120
  }
};

reactMixin.onClass(LabTemperatureTest, leapStateHandling);
