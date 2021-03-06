import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import LeapConnectionDialog from '../common/js/components/leap-connection-dialog.jsx';
import setLabProps from '../common/js/mixins/set-lab-props';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import FistBump from './fist-bump';
import avg from '../common/js/tools/avg';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import SettingsDialog from '../common/js/components/settings-dialog.jsx';
import AboutDialog from '../common/js/components/about-dialog.jsx';
import About from './about.jsx';
import interactive from './lab-interactive.json';
import phantomHands from './phantom-hands';
import model from './lab-model.json';
import t, {translateJson} from '../common/js/tools/translate.js';
import './lab-voule-pressure.less';
import getURLParam from '../common/js/tools/get-url-param';

const MAX_VOL = 0.82;
const MIN_VOL = 0.1;
const VOLUME_MULT = 0.11;

const DEF_LAB_PROPS = {
  volume: MAX_VOL,
  orientation: 'left',
  plungerHighlighted: false,
  atomsHighlighted: false,
  markersCount: 25,
  markerFadeSpeed: 0.075,
  markerSensitivity: 1,
  plungerRodVisible: true
};

const IFRAME_WIDTH = 510;
const IFRAME_HEIGHT = 350;

export default class LabVolumePressure extends React.Component {
  constructor(props) {
    super(props);
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    let lang = getURLParam('lang') || props.lang || 'en_us';
    let translatedInteractive = translateJson(interactive, ['title','text','label'], lang);
    let allInstructions = this.loadInstructions(lang);

    this.state = {
      leapState: {},
      overlayEnabled: true,
      language: lang,
      allInstructions,
      translatedInteractive,
      leapConnected: false
    }
  }

  loadInstructions(lang){
    let instructions = {
      DEFAULT: t('~VOLUME_PRESSURE_DEFAULT', lang),
      NO_HANDS: t('~VOLUME_PRESSURE_NO_HANDS', lang),
      HAND_MISSING: t('~VOLUME_PRESSURE_HAND_MISSING', lang),
      ROTATE: t('~VOLUME_PRESSURE_ROTATE', lang),
      FIST: t('~VOLUME_PRESSURE_FIST', lang)
    };
    return instructions;
  }

  componentDidMount() {
    this.fistBump = new FistBump({}, this.gestureCallbacks);
  }

  labModelLoaded() {
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
    // Mixin method that updates overlayActive state.
    this.resetOverlay();
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
  }

  get finalGesture() {
    const { labProps } = this.state;
    return labProps.plungerHighlighted && labProps.atomsHighlighted;
  }

  get plotter() {
    return this.refs.status.plotter;
  }

  get gestureCallbacks() {
    return {
      leapState: (leapState) => {
        let orientation = this.state.labProps.orientation;
        this.setLabProps({
          plungerHighlighted: leapState.verticalHand && leapState.verticalHand.type === orientation,
          atomsHighlighted: leapState.closedHand && leapState.closedHand.type !== orientation
        });
        this.setState({leapState});
        this.plotter.showCanvas(null);

        if (!this.finalGesture) {
          // Mixin method that updates overlayActive state.
          this.updateOverlayOnGestureNotDetected(leapState.numberOfHands);
        }
      },
      orientationDetected: (orientation) => {
        this.setLabProps({orientation: orientation});
      },
      gestureDetected: (freqSample) => {
        avg.addSample('freq', freqSample, Math.round(this.props.freqAvg));
        let freq = avg.getAvg('freq');
        let volume = Math.max(MIN_VOL, Math.min(MAX_VOL, MAX_VOL - VOLUME_MULT * freq));

        this.plotter.showCanvas('gesture-detected');
        this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
        this.plotter.update();

        this.setLabProps({volume: volume});

        // Mixin method that updates overlayActive state.
        this.updateOverlayOnGestureDetected();
      }
    };
  }

  handleLeapFrame(frame) {
    return this.fistBump.handleLeapFrame(frame);
  }
  handleDeviceConnected(){
    const { leapConnected } = this.state;
    if (!leapConnected){
      console.log("Device connected in Volume Pressure sim");
      this.setState({leapConnected: true});
    }
  }
  handleDeviceDisconnected(){
    const { leapConnected } = this.state;
    if (leapConnected){
      console.log("Device disconnected in Volume Pressure sim");
      this.setState({leapConnected: false});
    }
  }
  getHintName() {
    const state = this.state.leapState;
    if (state.numberOfHands === 0) {
      return 'noHands';
    }
    if (state.numberOfHands < 2) {
      return 'handMissing';
    }
    if (!state.verticalHand) {
      return 'rotate';
    }
    if (!state.closedHand) {
      return 'fist';
    }
    return 'tap';
  }

  getHintText() {
    const {allInstructions} = this.state;
    switch(this.getHintName()) {
      case 'noHands': return allInstructions.NO_HANDS;
      case 'handMissing': return allInstructions.HAND_MISSING;
      case 'rotate': return allInstructions.ROTATE;
      case 'fist': return allInstructions.FIST;
      default: return allInstructions.DEFAULT;
    }
  }

  render() {
    const { overlayEnabled, overlayActive, labProps, translatedInteractive, language, leapConnected } = this.state;
    const overlayVisible = overlayEnabled && overlayActive;
    return (
      <div>
        <h1>{t('~VOLUME_PRESSURE_TITLE', language)}</h1>
        <div className='container'>
          <Lab ref='labModel' interactive={translatedInteractive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={75}
               props={labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <InstructionsOverlay visible={overlayVisible}
                               handsViewProps={{phantomHands: phantomHands[overlayVisible && this.getHintName()]}}>
            <div className='instructions'>
              <p className='text'>{this.getHintText()}</p>
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
                <td>{t('~LAB_PRESSURE_ROD_VISIBLE', language)}:</td>
                <td>
                  <input type='checkbox' name='plungerRodVisible' checked={labProps.plungerRodVisible || false} onChange={this.handleLabPropChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~LAB_PRESSURE_NUMBER_SPOTS', language)}:</td>
                <td>
                  <input type='text' name='markersCount' size='7'
                         value={labProps.markersCount || 0}
                         onChange={this.handleLabPropChange}/>
                  <input type='range' name='markersCount'
                         min='0' max='25'
                         value={labProps.markersCount || 0}
                         onChange={this.handleLabPropChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~LAB_PRESSURE_SPOT_FADE_SPEED', language)}:</td>
                <td>
                  <input type='text' name='markerFadeSpeed' size='7'
                         value={labProps.markerFadeSpeed || 0}
                         onChange={this.handleLabPropChange}/>
                  <input type='range' name='markerFadeSpeed'
                         min='0.005' max='0.075' step='0.005'
                         value={labProps.markerFadeSpeed || 0}
                         onChange={this.handleLabPropChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~LAB_PRESSURE_SPOT_SENSITIVITY', language)}:</td>
                <td>
                  <input type='text' name='markerSensitivity' size='7'
                         value={labProps.markerSensitivity || 0}
                         onChange={this.handleLabPropChange}/>
                  <input type='range' name='markerSensitivity'
                         min='0.1' max='5' step='0.1'
                         value={labProps.markerSensitivity || 0}
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

reactMixin.onClass(LabVolumePressure, pureRender);
reactMixin.onClass(LabVolumePressure, leapStateHandlingV2);
reactMixin.onClass(LabVolumePressure, setLabProps);
reactMixin.onClass(LabVolumePressure, overlayVisibility);
