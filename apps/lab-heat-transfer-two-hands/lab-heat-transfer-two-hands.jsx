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
import phantomHands from './phantom-hands.js';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import t, {translateJson} from '../common/js/tools/translate.js';
import './lab-heat-transfer-two-hands.less'

import getURLParam from '../common/js/tools/get-url-param';

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
    this.fistsShaking = new FistsShaking({});
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.soundEnabledChanged = this.soundEnabledChanged.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSpoonVisibility = this.handleSpoonVisibility.bind(this);

    let spoonEnabled = getURLParam('spoon') !== null ? getURLParam('spoon') : (this.props.spoonEnabled ? this.props.spoonEnabled : DEF_LAB_PROPS.spoonEnabled);
    let lang = getURLParam('lang') || props.lang || 'en_us';
    let translatedInteractive = translateJson(interactive, ['title','text','label'], lang);
    let allInstructions = this.loadInstructions(lang);

    this.state = {
      leapState: null,
      overlayEnabled: true,
      spoonEnabled,
      language: lang,
      allInstructions,
      translatedInteractive,
      leapConnected: false
    };
  }

  loadInstructions(lang){
    let instructions = {
      INITIAL: t('~HEAT_TRANSFER_TWO_INITIAL', lang),
      ONE_HAND: t('~HEAT_TRANSFER_TWO_ONE_HAND', lang),
      TWO_HANDS: t('~HEAT_TRANSFER_TWO_HANDS', lang),
      SIDE_UNCLEAR: t('~HEAT_TRANSFER_TWO_UNCLEAR', lang),
      CLOSED_FISTS: t('~HEAT_TRANSFER_TWO_CLOSED_FISTS', lang)
    };
    return instructions;
  }

  handleLeapFrame(frame) {
    const data = this.fistsShaking.handleLeapFrame(frame);
    if (data.numberOfClosedHands === 2 && data.selectedSide) {
      this.gestureDetected(data);
    } else {
      this.gestureNotDetected(data);
    }
  }
  handleDeviceConnected(){
    const { leapConnected } = this.state;
    if (!leapConnected){
      console.log("Device connected in Heat Transfer (two hands) sim");
      this.setState({leapConnected: true});
    }
  }
  handleDeviceDisconnected(){
    const { leapConnected } = this.state;
    if (leapConnected){
      console.log("Device disconnected in Heat Transfer (two hands) sim");
      this.setState({leapConnected: false});
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

    // Mixin method that updates overlayActive state.
    this.updateOverlayOnGestureDetected();
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
    const { spoonEnabled } = this.state;
    // Reset Lab properties when model is reloaded.
    let labProps = DEF_LAB_PROPS;
    labProps.spoonEnabled = spoonEnabled;
    this.setLabProps(labProps);
    // Mixin method that updates overlayActive state.
    this.resetOverlay();
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
  }

  handleSpoonVisibility(event){
    const {spoonEnabled } = this.state;
    this.setState({spoonEnabled: !spoonEnabled})
    this.handleLabPropChange(event);
  }

  soundEnabledChanged(event) {
    this.fistsShaking.config.soundEnabled = event.target.checked;
  }

  getHintText() {
    const {leapState, allInstructions} = this.state;
    switch(leapState) {
      case 'initial':
        return allInstructions.INITIAL;
      case 'oneHand':
        return allInstructions.ONE_HAND;
      case 'twoHands':
        return allInstructions.TWO_HANDS;
      case 'sideUnclear':
        return allInstructions.SIDE_UNCLEAR;
      case 'closedFists':
        return allInstructions.CLOSED_FISTS;
    }
  }

  render() {
    const { overlayEnabled, overlayActive, labProps, leapState, spoonEnabled, translatedInteractive, language, leapConnected } = this.state;
    const overlayVisible = overlayEnabled && overlayActive;
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
          <InstructionsOverlay visible={overlayVisible}
                               handsViewProps={{phantomHands: phantomHands[overlayVisible && leapState]}}>
            <div className='instructions'>
              <p className='text'>{this.getHintText()}</p>
            </div>
          </InstructionsOverlay>
        </div>
        <div className='top-links'>
          <LeapConnectionDialog connected={leapConnected} title={t('~LEAP_CONNECTION', language)} />
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
                <td>{t('~HEAT_TRANSFER_SPOON', language)}:</td>
                <td>
                  <input type='checkbox' name='spoonEnabled'
                         checked={spoonEnabled}
                         onChange={this.handleSpoonVisibility}/>
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
