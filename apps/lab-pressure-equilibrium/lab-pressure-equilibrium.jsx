import React from 'react';
import reactMixin from 'react-mixin';
import Lab from 'react-lab';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import FistBump from '../common/js/gestures/fist-bump';
import AddRmObj from '../common/js/gestures/add-rm-obj';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import avg from '../common/js/tools/avg';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

export default class LabPressureEquilibrium extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.fistBumpDetected.bind(this), this.plotter);
    this.addRmObj = new AddRmObj(this.props.addRmAtomConfig, this.addRmAtomDetected.bind(this), this.plotter);
    this.setupLabCommunication();
  }
  
  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  setupLabCommunication() {
    this.purpleAtomsCount = 30;
    this.yellowAtomsCount = 30;
    this.labPhone = this.refs.labModel.phone;
    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
    }.bind(this));
  }

  fistBumpDetected() {
    let freq = 0;
    if (this.fistBump.hand.type === 'left') {
      avg.addSample('freqLeft', this.fistBump.freq, Math.round(this.props.freqAvg));
      freq = avg.getAvg('freqLeft');
      this.labPhone.post('set', { name: 'purpleAtomTemperature', value: 1 + freq * this.props.tempMult });
    } else {
      avg.addSample('freqRight', this.fistBump.freq, Math.round(this.props.freqAvg));
      freq = avg.getAvg('freqRight');
      this.labPhone.post('set', { name: 'yellowAtomTemperature', value: 1 + freq * this.props.tempMult });
    }
   this.plotter.showCanvas('gesture-detected');
   this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
   this.plotter.plot('velocity', this.fistBump.hand.palmVelocity[0]);
   this.plotter.update();
  }

  addRmAtomDetected(data) {
    if (data.removed && data.handType === 'left') {
      this.purpleAtomsCount -= 5;
      this.labPhone.post('set', { name: 'purpleAtomsCount', value: this.purpleAtomsCount });
    } else if (data.removed && data.handType === 'right') {
      this.yellowAtomsCount -= 5;
      this.labPhone.post('set', { name: 'yellowAtomsCount', value: this.yellowAtomsCount });
    } else if (data.added && data.handType === 'left') {
      this.purpleAtomsCount += 5;
      this.labPhone.post('set', { name: 'purpleAtomsCount', value: this.purpleAtomsCount });
    } else if (data.added && data.handType === 'right') {
      this.yellowAtomsCount += 5;
      this.labPhone.post('set', { name: 'yellowAtomsCount', value: this.yellowAtomsCount });
    }
  }

  nextLeapState(stateId, frame, data) {
    return this.fistBump.nextLeapState(stateId, frame, data) || this.addRmObj.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Use one hand to add or remove atoms, use two hands to heat up or cool down atoms.';
      case 'oneHandDetected':
        return (
          <div>
            <p>Close your hand, move it <b>up</b> and open to <b>remove</b> an atom.</p>
            <p>Close your hand, move it <b>down</b> and open to <b>add</b> an atom.</p>
          </div>
        );
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
          <Lab ref='labModel' interactive={interactive} model={model}
               width='610px' height='350px'/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

LabPressureEquilibrium.defaultProps = {
  tempMult: 850, // freq * temp mult = new target temperature
  freqAvg: 120,
  handBumpConfig: {
    // use defaults
  },
  addRmAtomConfig: {
    closedGrabStrength: 0.8,
    minAmplitude: 50, // mm
    maxTime: 2000     // ms
  }
};

reactMixin.onClass(LabPressureEquilibrium, leapStateHandling);
