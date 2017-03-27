import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import FistsShaking from './fists-shaking';
import avg from '../common/js/tools/avg';
import LeapStatus from '../common/js/components/leap-status.jsx';
import AboutDialog from '../common/js/components/about-dialog.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import './lab-heat-transfer-micro.less'

const IFRAME_WIDTH = 510;
const IFRAME_HEIGHT = 400;
const FREQ_AVG = 120;

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

    // Mixin method that updates overlayActive state.
    this.updateOverlayOnGestureDetected();
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

    // Mixin method that updates overlayActive state.
    this.updateOverlayOnGestureNotDetected(data.numberOfHands);
  }

  get plotter() {
    return this.refs.status.plotter;
  }

  setLeapState(v) {
    if (v !== this.state.leapState) this.setState({leapState: v});
  }

  labModelLoaded() {
    // Mixin method that updates overlayActive state.
    this.resetOverlay();
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
        return 'Place two hands over the Leap controller.';
      case 'oneHandDetected':
        return 'Place two hands over the Leap controller.';
      case 'twoHandsDetected':
        return 'Close your fists to become molecules.';
      case 'oneClosedFist':
        return 'Close your fists to become molecules.';
      case 'closedFists':
        return 'Bump your fists to show the molecules colliding.';
    }
  }

  render() {
    const { aboutVisible, settingsVisible } = this.props;
    const { overlayEnabled, overlayActive, labProps } = this.state;
    return (
      <div>
        <div className='container'>
          <Lab ref='labModel' interactive={interactive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={75}
               props={labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <InstructionsOverlay visible={overlayEnabled && overlayActive}>
            <div className='instructions'>
              {this.getStateMsg()}
            </div>
          </InstructionsOverlay>
        </div>
        <LeapStatus visible={settingsVisible} ref='status'>
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
        <AboutDialog visible={aboutVisible} />
      </div>
    );
  }
}

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
reactMixin.onClass(LabHeatTransfer, overlayVisibility);
