import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import FistShake from '../gestures/fist-shake';
import avg from '../tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from './leap-standard-info.jsx';

export default class LabHeatTransfer extends React.Component {
  componentDidMount() {
    this.fistShake = new FistShake(this.props.handShakeConfig, this.gestureDetected.bind(this), this.plotter);
    this.setupLabCommunication();
    this.handType = null;
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  setupLabCommunication() {
    this.labPhone = new iframePhone.ParentEndpoint(this.refs.labModel);
    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
    }.bind(this));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.leapState === 'gestureDetected') {
      this.labPhone.post('set', { name: 'markedBlock', value: this.handType });
    } else {
      this.labPhone.post('set', { name: 'markedBlock', value: 'none' });
      this.handType = null;
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
          <iframe ref='labModel' width='610px' height='350px' frameBorder='0' src='http://lab.concord.org/embeddable.html#interactives/grasp/heat-transfer.json'/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
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
