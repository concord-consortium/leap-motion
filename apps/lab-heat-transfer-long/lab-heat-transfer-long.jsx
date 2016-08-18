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
import './lab-heat-transfer-long.less'

const IFRAME_WIDTH = 510;
const IFRAME_HEIGHT = 400;
const FREQ_AVG = 120;
const MIN_GESTURE_TIME = 3000;

export default class LabHeatTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.fistsShaking = new FistsShaking({});
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.soundEnabledChanged = this.soundEnabledChanged.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.state = {
      leapState: 'initial',
      overlayEnabled: true,
      overlayVisible: true,
      gestureEverDetected: false,
      gestureDetectedTimestamp: null,
      freqCooling: 2,
      freqHeating: 2
    }
  }

  handleLeapFrame(frame) {
    const data = this.fistsShaking.handleLeapFrame(frame);
    if (data.numberOfClosedHands === 2) {
      this.gestureDetected(data);
    } else {
      this.gestureNotDetected(data);
    }
  }

  gestureDetected(data) {
    let avgFreq;
    avg.addSample('freq', data.frequency, Math.round(FREQ_AVG));
    avgFreq = avg.getAvg('freq');

    this.setLeapState('closedFists');
    this.setLabProps({keChange: this.freq2KEChange(avgFreq)});

    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('frequency', avgFreq, {min: 0, max: 9, precision: 2});
    this.plotter.update();

    const { gestureDetectedTimestamp } = this.state;
    if (!gestureDetectedTimestamp) {
      this.setState({gestureDetectedTimestamp: Date.now()});
    }
    if (gestureDetectedTimestamp && Date.now() - gestureDetectedTimestamp > MIN_GESTURE_TIME) {
      // Disable overlay after gesture has been detected for some time.
      this.setState({overlayVisible: false, gestureEverDetected: true});
    }
  }

  gestureNotDetected(data) {
    // Some conditions are not met.
    if (data.numberOfHands === 0) {
      this.setLeapState('initial');
    } else if (data.numberOfHands === 1) {
      this.setLeapState('oneHandDetected');
    } else if (data.numberOfHands === 2 && data.numberOfClosedHands === 0) {
      this.setLeapState('twoHandsDetected');
    } else if (data.numberOfHands === 2 && data.numberOfClosedHands === 1) {
      this.setLeapState('oneClosedFist');
    }
    this.plotter.showCanvas(null);
    this.setLabProps({keChange: false});

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
    this.setState({overlayVisible: true, gestureEverDetected: false, gestureDetectedTimestamp: null});
  }

  soundEnabledChanged(event) {
    this.fistsShaking.config.soundEnabled = event.target.checked;
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
  }

  freq2KEChange(freq) {
    const { freqCooling, freqHeating } = this.state;
    if (freq < freqCooling) {
      return 'decreasing';
    }
    if (freq >= freqHeating) {
      return 'increasing';
    }
    return 'neutral';
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hands steady above the Leap device.';
      case 'oneHandDetected':
        return 'Put the other hand above the Leap device.';
      case 'twoHandsDetected':
        return 'Close your fists.';
      case 'oneClosedFist':
        return 'Close the other fist.';
      case 'closedFists':
        return 'Bump the molecules together. Try fast and slow.';
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
              <td>
                Sound:
              </td>
              <td>
                <input type='checkbox' name='soundEnabled'
                       defaultChecked={this.fistsShaking.config.soundEnabled}
                       onChange={this.soundEnabledChanged}/>
              </td>
            </tr>
            <tr>
              <td>Cooling frequency:</td>
              <td>
                <input type='text' name='freqCooling' size='7'
                       value={this.state.freqCooling}
                       onChange={this.handleInputChange}/>
                <input type='range' name='freqCooling'
                       min='0' max='8' step='0.1'
                       value={this.state.freqCooling}
                       onChange={this.handleInputChange}/>
              </td>
            </tr>
            <tr>
              <td>Heating frequency:</td>
              <td>
                <input type='text' name='freqHeating' size='7'
                       value={this.state.freqHeating}
                       onChange={this.handleInputChange}/>
                <input type='range' name='freqHeating'
                       min='0' max='8' step='0.1'
                       value={this.state.freqHeating}
                       onChange={this.handleInputChange}/>
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
