import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import avg from '../common/js/tools/avg';
import FistBump from '../common/js/gestures/fist-bump';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';

export default class LabTemperatureTest extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  handleGestureConfigChange(event) {
    this.fistBump.config[event.target.name] = event.target.value;
  }

  gestureDetected() {
    avg.addSample('newFreq', this.fistBump.freq, Math.round(this.props.freqAvg));
    avg.addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('max velocity avg', avg.getAvg('maxVel'), {min: 0, max: 1500, precision: 2});
    this.plotter.plot('frequency', avg.getAvg('newFreq'), {min: 0, max: 9, precision: 2});
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
      <div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
        <p>
          Max distance between hands during knocking: <input type='text' name='maxKnockDist'
                                                             defaultValue={this.props.handBumpConfig.maxKnockDist}
                                                             onChange={this.handleGestureConfigChange.bind(this)}/>
        </p>
      </div>
    )
  }
}

LabTemperatureTest.defaultProps = {
  maxVelAvg: 120,
  freqAvg: 120,
  handBumpConfig: {
    maxKnockDist: 150
  }
};

reactMixin.onClass(LabTemperatureTest, leapStateHandling);
