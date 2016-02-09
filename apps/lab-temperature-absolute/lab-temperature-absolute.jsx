import React from 'react';
import reactMixin from 'react-mixin';
import Lab from 'react-lab';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import FistBump from '../common/js/gestures/fist-bump';
import avg from '../common/js/tools/avg';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import interactive from '../common/lab/temperature-pressure-relationship-interactive.json';
import model from '../common/lab/temperature-pressure-relationship-model.json';

export default class LabTemperatureAbsolute extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
    this.setupLabCommunication();
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  setupLabCommunication() {
    this.labPhone = this.refs.labModel.phone;
    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
    }.bind(this));
  }

  gestureDetected() {
    avg.addSample('freq', this.fistBump.freq, Math.round(this.props.freqAvg));
    let freq = avg.getAvg('freq');
    this.labPhone.post('set', { name: 'targetTemperature', value: freq * this.props.tempMult });
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
    this.plotter.plot('velocity', this.fistBump.hand.palmVelocity[0]);
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
        <div>
          <Lab ref='labModel' interactive={interactive} model={model} width='610px' height='350px'/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

LabTemperatureAbsolute.defaultProps = {
  tempMult: 850, // freq * temp mult = new target temperature
  freqAvg: 120,
  handBumpConfig: {
    // use defaults
  }
};

reactMixin.onClass(LabTemperatureAbsolute, leapStateHandling);
