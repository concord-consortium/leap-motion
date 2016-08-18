import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistsShaking from './fists-shaking';
import avg from '../common/js/tools/avg';
import LeapStatus from '../common/js/components/leap-status.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import './lab-heat-transfer-two-hands.less'

const TEMP_MULT = 115; // freq * temp mult = new target temperature
const MAX_TEMP = 600;
const MIN_TEMP = 30;
const FREQ_AVG = 120;
const DEF_LAB_PROPS = {
  markedBlock: 'none',
  leftAtomsTargetTemp: 500,
  rightAtomsTargetTemp: 50,
  spoonEnabled: false
};

const MIN_FREQ_TO_HIDE_INSTRUCTIONS = 1;
const IFRAME_WIDTH = 610;
const IFRAME_HEIGHT = 450;

function freq2temp(freq) {
  // + Math.random() ensures that we won't skip Lab property update due to caching
  // when the temperature is equal to allowed min or max. This interactive is implemented
  // in a way which requires multiple repetitions of `onChange` callback till atoms
  // reach the desired temperature.
  return Math.max(MIN_TEMP, Math.min(MAX_TEMP, freq * TEMP_MULT)) + Math.random();
}

export default class LabHeatTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.fistsShaking = new FistsShaking({});
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.soundEnabledChanged = this.soundEnabledChanged.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleLabPropChange = this.handleLabPropChange.bind(this);
    this.state = {
      leapState: 'initial',
      overlayEnabled: true,
      overlayVisible: true,
      gestureEverDetected: false
    };
  }

  handleLeapFrame(frame) {
    const data = this.fistsShaking.handleLeapFrame(frame);
    if (data.numberOfClosedHands === 2 && data.selectedSide) {
      this.gestureDetected(data);
    } else {
      this.gestureNotDetected(data);
    }
  }

  gestureDetected(data) {
    let avgFreq;
    const newLabProps = {markedBlock: data.selectedSide};
    if (data.selectedSide === 'left') {
      avg.addSample('freqLeft', data.frequency, Math.round(FREQ_AVG));
      avgFreq = avg.getAvg('freqLeft');
      newLabProps.leftAtomsTargetTemp = freq2temp(avgFreq);
    } else {
      avg.addSample('freqRight', data.frequency, Math.round(FREQ_AVG));
      avgFreq = avg.getAvg('freqRight');
      newLabProps.rightAtomsTargetTemp = freq2temp(avgFreq);
    }
    this.setLabProps(newLabProps);
    this.setLeapState('closedFists');

    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('frequency', avgFreq, {min: 0, max: 9, precision: 2});
    this.plotter.update();

    if (avgFreq > MIN_FREQ_TO_HIDE_INSTRUCTIONS) {
      this.setState({overlayVisible: false, gestureEverDetected: true});
    }
  }

  gestureNotDetected(data) {
    this.setLabProps({markedBlock: 'none'});
    this.plotter.showCanvas(null);
    if (data.numberOfClosedHands === 2) {
      this.setLeapState('sideUnclear');
    } else if (data.numberOfHands === 2) {
      this.setLeapState('twoHands');
    } else if (data.numberOfHands === 1) {
      this.setLeapState('oneHand');
    } else {
      this.setLeapState('initial');
    }

    if (data.numberOfHands > 0) {
      // Show overlay if user keeps his hands over the Leap.
      this.setState({overlayVisible: true});
    } else if (this.state.gestureEverDetected) {
      // But hide it if user removes hands and gesture has been detected before.
      // This might be useful when user simply wants to watch the simulation.
      this.setState({overlayVisible: false});
    }
  }

  get plotter() {
    return this.refs.status.plotter;
  }

  setLeapState(v) {
    if (v !== this.state.leapState) this.setState({leapState: v});
  }

  labModelLoaded() {
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
    this.setState({overlayVisible: true, gestureEverDetected: false})
  }

  handleLabPropChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setLabProps(props);
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
  }

  soundEnabledChanged(event) {
    this.fistsShaking.config.soundEnabled = event.target.checked;
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hands steady above the Leap device';
      case 'oneHand':
        return 'Use two hands';
      case 'twoHands':
        return 'Close your fists';
      case 'sideUnclear':
        return 'Move your hands to the left or right to select one block of the molecules';
      case 'closedFists':
        return 'Shake your fists';
    }
  }

  render() {
    const { overlayEnabled, overlayVisible, labProps } = this.state;
    return (
      <div>
        <div className='container'>
          <Lab ref='labModel' interactive={interactive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={75}
               props={labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <InstructionsOverlay visible={overlayEnabled && overlayVisible} width={IFRAME_WIDTH} height={IFRAME_HEIGHT - 3}>
            {this.getStateMsg()}
          </InstructionsOverlay>
        </div>
        <LeapStatus ref='status'>
          <table>
            <tbody>
            <tr>
              <td>Overlay:</td>
              <td>
                <input type='checkbox' name='overlayEnabled'
                       checked={overlayEnabled}
                       onChange={this.handleInputChange}/>
              </td>
            </tr>
            <tr>
              <td>Spoon:</td>
              <td>
                <input type='checkbox' name='spoonEnabled'
                       checked={labProps.spoonEnabled || false}
                       onChange={this.handleLabPropChange}/>
              </td>
            </tr>
            <tr>
              <td>Sound:</td>
              <td>
                <input type='checkbox' name='soundEnabled'
                       defaultChecked={this.fistsShaking.config.soundEnabled}
                       onChange={this.soundEnabledChanged}/>
              </td>
            </tr>
            </tbody>
          </table>
        </LeapStatus>
      </div>
    );
  }
}

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
