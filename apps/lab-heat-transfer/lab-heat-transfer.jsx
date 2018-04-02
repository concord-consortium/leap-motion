import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistShake from './fist-shake';
import avg from '../common/js/tools/avg';
import SettingsDialog from '../common/js/components/settings-dialog.jsx';
import AboutDialog from '../common/js/components/about-dialog.jsx';
import About from './about.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import t, {translateJson} from '../common/js/tools/translate.js';
import './lab-heat-transfer.less'

import getURLParam from '../common/js/tools/get-url-param';

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
    this.handleSpoonVisibility = this.handleSpoonVisibility.bind(this);

    let spoonEnabled = getURLParam('spoon') !== null ? getURLParam('spoon') : (this.props.spoonEnabled ? this.props.spoonEnabled : DEF_LAB_PROPS.spoonEnabled);
    let lang = getURLParam('lang') || props.lang || 'en_us';
    let translatedInteractive = translateJson(interactive, ['title','text','label'], lang);
    let allInstructions = this.loadInstructions(lang);

    this.state = {
      leapState: 'initial',
      overlayEnabled: true,
      spoonEnabled,
      language: lang,
      allInstructions,
      translatedInteractive
    }
  }

  loadInstructions(lang){
    let instructions = {
      INITIAL: t('~HEAT_TRANSFER_INITIAL', lang),
      ONE_HAND: t('~HEAT_TRANSFER_ONE_HAND', lang),
      CLOSED_HAND: t('~HEAT_TRANSFER_CLOSED_HAND', lang)
    };
    return instructions;
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
    const { spoonEnabled } = this.state;
    // Reset Lab properties when model is reloaded.
    let labProps = DEF_LAB_PROPS;
    labProps.spoonEnabled = spoonEnabled;
    this.setLabProps(labProps);
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

  handleSpoonVisibility(event){
    const {spoonEnabled } = this.state;
    this.setState({spoonEnabled: !spoonEnabled})
    this.handleLabPropChange(event);
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
    const {leapState, allInstructions} = this.state;
    switch(leapState) {
      case 'initial':
        return allInstructions.INITIAL;
      case 'oneHandDetected':
        return allInstructions.ONE_HAND;
      case 'closedHand':
        return allInstructions.CLOSED_HAND;
    }
  }

  render() {
    const { translatedInteractive, overlayEnabled, overlayActive, labProps, spoonEnabled, language } = this.state;
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
          <InstructionsOverlay visible={overlayVisible}>
            <div className='instructions'>
              {this.getStateMsg()}
            </div>
          </InstructionsOverlay>
        </div>
        <div className='top-links'>
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
                         defaultChecked={this.fistShake.config.soundEnabled}
                         onChange={this.soundEnabledChanged}/>
                </td>
              </tr>
              <tr>
                <td>{t('~NO_HAND_CHECK', language)}:</td>
                <td>
                  <input type='text' name='clearHandTimeout'
                         defaultValue={this.fistShake.config.resetHandTimeout}
                         onChange={this.resetHandTimeoutChanged}/>
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

LabHeatTransfer.defaultProps = {
  interactive,
  model
};

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
reactMixin.onClass(LabHeatTransfer, overlayVisibility);
