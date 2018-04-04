import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import LeapConnectionDialog from '../common/js/components/leap-connection-dialog.jsx';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistsShaking from './fists-shaking';
import avg from '../common/js/tools/avg';
import SettingsDialog from '../common/js/components/settings-dialog.jsx';
import AboutDialog from '../common/js/components/about-dialog.jsx';
import About from './about.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

import t, {translateJson} from '../common/js/tools/translate.js';
import getURLParam from '../common/js/tools/get-url-param';
import './lab-heat-transfer-long.less'

const IFRAME_WIDTH = 510;
const IFRAME_HEIGHT = 400;
const FREQ_AVG = 120;
const DEF_LAB_PROPS = {
  epsilon: 2
};

export default class LabHeatTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.fistsShaking = new FistsShaking({});
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.soundEnabledChanged = this.soundEnabledChanged.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    let lang = getURLParam('lang') || props.lang || 'en_us';
    let translatedInteractive = translateJson(interactive, ['title','text','label'], lang);
    let allInstructions = this.loadInstructions(lang);

    this.state = {
      leapState: 'initial',
      overlayEnabled: true,
      freqCooling: 2,
      freqHeating: 2,
      language: lang,
      allInstructions,
      translatedInteractive,
      leapConnected: false
    }
  }

  loadInstructions(lang){
    let instructions = {
      INITIAL: t('~HEAT_TRANSFER_TWO_INITIAL', lang),
      ONE_HAND: t('~HEAT_TRANSFER_TWO_ONE_HAND', lang),
      TWO_HANDS: t('~HEAT_TRANSFER_TWO_HANDS', lang),
      ONE_CLOSED_FIST: t('~HEAT_TRANSFER_MICRO_DIRECT_ONE_FIST', lang),
      CLOSED_FISTS: t('~HEAT_TRANSFER_TWO_CLOSED_FISTS', lang)
    };
    return instructions;
  }

  handleLeapFrame(frame) {
    const data = this.fistsShaking.handleLeapFrame(frame);
    if (data.numberOfClosedHands === 2) {
      this.gestureDetected(data);
    } else {
      this.gestureNotDetected(data);
    }
  }
  handleDeviceConnected(){
    const { leapConnected } = this.state;
    if (!leapConnected){
      console.log("Device connected in Heat Transfer (long) sim");
      this.setState({leapConnected: true});
    }
  }
  handleDeviceDisconnected(){
    const { leapConnected } = this.state;
    if (leapConnected){
      console.log("Device disconnected in Heat Transfer (long) sim");
      this.setState({leapConnected: false});
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
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
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
    const {leapState, allInstructions} = this.state;
    switch(leapState) {
      case 'initial':
        return allInstructions.INITIAL;
      case 'oneHandDetected':
        return allInstructions.ONE_HAND;
      case 'twoHandsDetected':
        return allInstructions.TWO_HANDS;
      case 'twoClosedFists':
        return allInstructions.CLOSED_FISTS;
      case 'oneClosedFist':
        return allInstructions.ONE_CLOSED_FIST;
      case 'closedFists':
        return allInstructions.CLOSED_FISTS;
    }
  }

  render() {
    const { overlayEnabled, overlayActive, labProps, translatedInteractive, language, leapConnected } = this.state;
    return (
      <div>
        <h1>{t('~HEAT_TRANSFER_TITLE', language)}</h1>
        <div className='container'>
          <Lab ref='labModel' interactive={translatedInteractive} model={model}
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
        <div className='top-links'>
          <LeapConnectionDialog connected={leapConnected} title={t('~LEAP_CONNECTION', language)} lang={language}/>
          <SettingsDialog ref='status' lang={language}>
            <table>
              <tbody>
              <tr>
                <td>{t('~OVERLAY', language)}:</td>
                <td>
                  <input type='checkbox' name='overlayEnabled'
                         checked={overlayEnabled}
                         onChange={this.handleInputChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~SOUND', language)}:</td>
                <td>
                  <input type='checkbox' name='soundEnabled'
                         defaultChecked={this.fistsShaking.config.soundEnabled}
                         onChange={this.soundEnabledChanged}/>
                </td>
              </tr>
              <tr>
                <td>{t('~COOLING_FREQUENCY', language)}:</td>
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
                <td>{t('~HEATING_FREQUENCY', language)}:</td>
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
              <tr>
                <td>{t('~EPSILON', language)}:</td>
                <td>
                  <input type='text' name='epsilon' size='7'
                         value={labProps.epsilon || 0}
                         onChange={this.handleLabPropChange}/>
                  <input type='range' name='epsilon'
                         min='0.2' max='5' step='0.1'
                         value={labProps.epsilon || 0}
                         onChange={this.handleLabPropChange}/>
                </td>
              </tr>
              </tbody>
            </table>
          </SettingsDialog>
          <AboutDialog lang={language}>
            <About />
          </AboutDialog>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
reactMixin.onClass(LabHeatTransfer, overlayVisibility);
