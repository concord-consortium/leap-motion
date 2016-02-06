import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistShake from './fist-shake';
import avg from '../common/js/tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import LabInteractive from '../common/js/components/lab-interactive.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

const TEMP_MULT = 115; // freq * temp mult = new target temperature
const FREQ_AVG = 120;
const DEF_LAB_PROPS = {
  markedBlock: 'none',
  leftAtomsTargetTemp: 250,
  rightAtomsTargetTemp: 250
};

export default class LabHeatTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.fistShake = new FistShake({}, this.gestureCallbacks);
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.soundEnabledChanged = this.soundEnabledChanged.bind(this);
    this.resetHandTimeoutChanged = this.resetHandTimeoutChanged.bind(this);
    this.state = {
      leapState: 'initial'
    }
  }

  handleLeapFrame(frame) {
    return this.fistShake.handleLeapFrame(frame);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  setLeapState(v) {
    if (v !== this.state.leapState) this.setState({leapState: v});
  }

  labModelLoaded() {
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
  }

  resetHandTimeoutChanged(event) {
    this.fistShake.config.resetHandTimeout = event.target.value;
  }

  soundEnabledChanged(event) {
    this.fistShake.config.soundEnabled = event.target.checked;
  }
  
  get gestureCallbacks() {
    return {
      leapState: (data) => {
        if (data.closedHandType) {
          this.setLabProps({markedBlock: data.closedHandType});
          this.setLeapState('closedHand');
        } else {
          this.setLabProps({markedBlock: 'none'});
          this.setLeapState(data.numberOfHands === 1 ? 'oneHandDetected' : 'initial');
          this.plotter.showCanvas(null);
        }
      },
      gestureDetected: (data) => {
        let avgFreq;
        if (data.closedHandType === 'left') {
          avg.addSample('freqLeft', data.frequency, Math.round(FREQ_AVG));
          avgFreq = avg.getAvg('freqLeft');
          this.setLabProps({leftAtomsTargetTemp: avgFreq * TEMP_MULT});
        } else {
          avg.addSample('freqRight', data.frequency, Math.round(FREQ_AVG));
          avgFreq = avg.getAvg('freqRight');
          this.setLabProps({rightAtomsTargetTemp: avgFreq * TEMP_MULT});
        }
        this.plotter.showCanvas('gesture-detected');
        this.plotter.plot('frequency', avgFreq, {min: 0, max: 9, precision: 2});
        this.plotter.update();
      }
    };
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
          <LabInteractive ref='labModel' interactive={interactive} model={model}
                          labProps={this.state.labProps}
                          onModelLoaded={this.labModelLoaded}
                          playing={true}/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
        <p>
          Sound: <input type='checkbox' name='soundEnabled'
                        defaultChecked={this.fistShake.config.soundEnabled}
                        onChange={this.soundEnabledChanged}/>
        </p>
        <p>
          "No hand" required duration [ms]: <input type='text' name='clearHandTimeout'
                                                   defaultValue={this.fistShake.config.resetHandTimeout}
                                                   onChange={this.resetHandTimeoutChanged}/>
        </p>
      </div>
    );
  }
}

reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
