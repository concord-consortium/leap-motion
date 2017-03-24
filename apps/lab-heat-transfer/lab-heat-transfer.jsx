import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistShake from './fist-shake';
import avg from '../common/js/tools/avg';
import LeapStatus from '../common/js/components/leap-status.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import './lab-heat-transfer.less'

const TEMP_MULT = 115; // freq * temp mult = new target temperature
const MAX_TEMP = 600;
const MIN_TEMP = 30;
const FREQ_AVG = 120;
const DEF_LAB_PROPS = {
  markedBlock: 'none',
  leftAtomsTargetTemp: 500,
  rightAtomsTargetTemp: 50,
  spoonEnabled: true
};

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
    this.fistShake = new FistShake({}, this.gestureCallbacks);
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.soundEnabledChanged = this.soundEnabledChanged.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.resetHandTimeoutChanged = this.resetHandTimeoutChanged.bind(this);
    this.state = {
      leapState: 'initial',
      overlayEnabled: true
    }
  }

  handleLeapFrame(frame) {
    return this.fistShake.handleLeapFrame(frame);
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
    // Mixin method that updates overlayActive state.
    this.resetOverlay();
  }

  resetHandTimeoutChanged(event) {
    this.fistShake.config.resetHandTimeout = event.target.value;
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
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

          // Mixin method that updates overlayActive state.
          this.updateOverlayOnGestureNotDetected(data.numberOfHands);
        }
      },
      gestureDetected: (data) => {
        let avgFreq;
        if (data.closedHandType === 'left') {
          avg.addSample('freqLeft', data.frequency, Math.round(FREQ_AVG));
          avgFreq = avg.getAvg('freqLeft');
          this.setLabProps({leftAtomsTargetTemp: freq2temp(avgFreq)});
        } else {
          avg.addSample('freqRight', data.frequency, Math.round(FREQ_AVG));
          avgFreq = avg.getAvg('freqRight');
          this.setLabProps({rightAtomsTargetTemp: freq2temp(avgFreq)});
        }
        this.plotter.showCanvas('gesture-detected');
        this.plotter.plot('frequency', avgFreq, {min: 0, max: 9, precision: 2});
        this.plotter.update();

        // Mixin method that updates overlayActive state.
        this.updateOverlayOnGestureDetected();
      }
    };
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Place one hand (left or right) over the Leap controller.';
      case 'oneHandDetected':
        return 'Close your fist to become one block of molecules.';
      case 'closedHand':
        return 'Shake your fist to show the molecules moving.';
    }
  }

  render() {
    const { interactive, model } = this.props;
    const { overlayEnabled, overlayActive, labProps } = this.state;
    const overlayVisible = overlayEnabled && overlayActive;
    return (
      <div>
        <div className='container'>
          <Lab ref='labModel' interactive={interactive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={75}
               props={labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <InstructionsOverlay visible={overlayVisible} width={IFRAME_WIDTH} height={IFRAME_HEIGHT}>
            <div className='instructions'>
              {this.getStateMsg()}
            </div>
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
                       checked={labProps.spoonEnabled}
                       onChange={this.handleLabPropChange}/>
              </td>
            </tr>
            <tr>
              <td>Sound:</td>
              <td>
                <input type='checkbox' name='soundEnabled'
                       defaultChecked={this.fistShake.config.soundEnabled}
                       onChange={this.soundEnabledChanged}/>
              </td>
            </tr>
            <tr>
              <td>"No hand" required duration [ms]:</td>
              <td>
                <input type='text' name='clearHandTimeout'
                       defaultValue={this.fistShake.config.resetHandTimeout}
                       onChange={this.resetHandTimeoutChanged}/>
              </td>
            </tr>
            </tbody>
          </table>
        </LeapStatus>
      </div>
    );
  }
}

LabHeatTransfer.defaultProps = {
  interactive,
  model
};

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
reactMixin.onClass(LabHeatTransfer, overlayVisibility);
