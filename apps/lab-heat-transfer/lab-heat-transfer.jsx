import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import FistShake from './fist-shake';
import avg from '../common/js/tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import LabInteractive from '../common/js/components/lab-interactive.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

const DEFAULT_CLEAR_HAND_TIMEOUT = 500; // ms

export default class LabHeatTransfer extends React.Component {
  componentDidMount() {
    this.fistShake = new FistShake(this.props.handShakeConfig, this.gestureDetected.bind(this), this.plotter);
    this.setupLabCommunication();
    this.handType = null;
    this.clearHandTimeout = DEFAULT_CLEAR_HAND_TIMEOUT;
    this.clearHandTimeoutID = null;
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

  clearHandTimeoutChanged(event) {
    this.clearHandTimeout = event.target.value;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.leapState === 'gestureDetected') {
      this.labPhone.post('set', { name: 'markedBlock', value: this.handType });
      if (this.clearHandTimeoutID !== null) {
        clearTimeout(this.clearHandTimeoutID);
        this.clearHandTimeoutID = null;
      }
    } else {
      this.labPhone.post('set', { name: 'markedBlock', value: 'none' });
      // Sometimes Leap confuses input hand.
      // Do not allow change of hand unless Leap detects a "no hand" condition of for some duration.
      if (this.clearHandTimeoutID === null) {
        this.clearHandTimeoutID = setTimeout(() => {
          this.handType = null;
        }, this.clearHandTimeout);
      }
    }
  }

  gestureDetected() {
    if (!this.handType) {
      // Save hand type at the beginning of gesture. Leap seems to be struggling with hand type
      // detection once fist is closed and sometimes erroneously switches reported type.
      // At this point hand type should be still reliable and we make sure that it'll be consistent
      // while user is shaking his hand.
      this.handType = this.fistShake.hand.type;
    }

    let freq;
    if (this.handType === 'left') {
      avg.addSample('freqLeft', this.fistShake.freq, Math.round(this.props.freqAvg));
      freq = avg.getAvg('freqLeft');
      this.labPhone.post('set', { name: 'leftAtomsTargetTemp', value: freq * this.props.tempMult });
    } else {
      avg.addSample('freqRight', this.fistShake.freq, Math.round(this.props.freqAvg));
      freq = avg.getAvg('freqRight');
      this.labPhone.post('set', { name: 'rightAtomsTargetTemp', value: freq * this.props.tempMult });
    }
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
    this.plotter.update();
  }

  nextLeapState(stateId, frame, data) {
    return this.fistShake.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hand (left or right) steady above the Leap device.';
      case 'oneHandDetected':
        return 'Close your fist.';
      case 'gestureDetected':
        return 'Shake your hand.';
    }
  }

  render() {
    return (
      <div>
        <div>
          <LabInteractive ref='labModel' interactive={interactive} model={model}/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
        <p>
          "No hand" required duration [ms]: <input type='text' name='clearHandTimeout'
                                      defaultValue={DEFAULT_CLEAR_HAND_TIMEOUT}
                                      onChange={this.clearHandTimeoutChanged.bind(this)}/>
        </p>
      </div>
    );
  }
}

LabHeatTransfer.defaultProps = {
  tempMult: 115, // freq * temp mult = new target temperature
  freqAvg: 120,
  handShakeConfig: {
    closedGrabStrength: 0.7,
    minAmplitude: 20
  }
};

reactMixin.onClass(LabHeatTransfer, leapStateHandling);
