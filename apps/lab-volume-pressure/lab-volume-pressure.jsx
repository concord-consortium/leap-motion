import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistBump from '../common/js/gestures/fist-bump';
import avg from '../common/js/tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import LabInteractive from '../common/js/components/lab-interactive.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

const MAX_VOL = 0.82;
const MIN_VOL = 0.1;

const DEF_LAB_PROPS = {
  pistonGestureStatus: false,
  volume: MAX_VOL
};

export default class LabVolumePressure extends React.Component {
  constructor(props) {
    super(props);
    this.labModelLoaded = this.labModelLoaded.bind(this);
  }

  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
  }

  componentWillUnmount() {
    clearInterval(this.simUpdateID);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.leapState !== prevState.leapState) {
      this.setLabProps({pistonGestureStatus: this.state.leapState});
    }
  }

  labModelLoaded() {
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  gestureDetected() {
    avg.addSample('freq', this.fistBump.freq, Math.round(this.props.freqAvg));
    let freq = avg.getAvg('freq');
    let volume = Math.max(MIN_VOL, Math.min(MAX_VOL, MAX_VOL - this.props.volumeMult * freq));
    this.setLabProps({volume: volume});

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
      case 'rightHandDetected':
      case 'closedHandDetected':
        return 'Twist your right hand and keep it open.';
      case 'leftHandDetected':
      case 'verticalHandDetected':
        return 'Close your left fist.';
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
          <LabInteractive ref='labModel' interactive={interactive} model={model}
                          labProps={this.state.labProps}
                          onModelLoaded={this.labModelLoaded}
                          playing={true}/>
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
reactMixin.onClass(LabVolumePressure, setLabProps);
