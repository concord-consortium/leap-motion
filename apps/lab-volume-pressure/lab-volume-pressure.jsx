import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import FistBump from '../common/js/gestures/fist-bump';
import avg from '../common/js/tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import LabInteractive from '../common/js/components/lab-interactive.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

const MAX_VOL = 0.82;
const MIN_VOL = 0.1;
const DEF_PISTON_COLOR = '#8CBBB8';
const ACTIVE_PISTON_COLOR = '#E8DC36';

export default class LabVolumePressure extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
    this.setupLabCommunication();
    this.volume = MAX_VOL;
    this.pistonColor = DEF_PISTON_COLOR;
    this.simUpdateID = setInterval(function () {
      this.labPhone.post('set', {name: {volume: this.volume, pistonColor: this.pistonColor}});
    }.bind(this), 75);
  }

  componentWillUnmount() {
    this.labPhone.disconnect();
    clearInterval(this.simUpdateID);
  }

  componentDidUpdate() {
    if (this.state.leapState === 'gestureDetected') {
      this.pistonColor = ACTIVE_PISTON_COLOR;
    } else {
      this.pistonColor = DEF_PISTON_COLOR;
    }
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
    this.volume = Math.max(MIN_VOL, Math.min(MAX_VOL, MAX_VOL - this.props.volumeMult * freq));
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
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
        return 'Close left fist and twist the right hand.';
      case 'gestureDetected':
        return 'Move your closed fist towards open palm and back rapidly.';
    }
  }

  render() {
    return (
      <div>
        <div>
          <LabInteractive ref='labModel' interactive={interactive} model={model}/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

LabVolumePressure.defaultProps = {
  volumeMult: 0.11,
  maxVelAvg: 120,
  handBumpConfig: {
    // Limit bumping only to the left hand, as wall is always on the right side.
    allowedHand: {
      left: true,
      right: false
    }
  }
};

reactMixin.onClass(LabVolumePressure, leapStateHandling);
