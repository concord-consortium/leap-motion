import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import LeapConnectionDialog from '../common/js/components/leap-connection-dialog.jsx';
import setLabProps from '../common/js/mixins/set-lab-props';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import FistShake from './fist-shake';
import SettingsDialog from '../common/js/components/settings-dialog.jsx';
import AboutDialog from '../common/js/components/about-dialog.jsx';
import About from './about.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import t, {translateJson} from '../common/js/tools/translate.js';
import './lab-heat-transfer-micro-direct.less'
import getURLParam from '../common/js/tools/get-url-param';

const IFRAME_WIDTH = 510;
const IFRAME_HEIGHT = 400;

export default class LabHeatTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.fistShake = new FistShake({}, this.gestureCallbacks);
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    let lang = getURLParam('lang') || props.lang || 'en_us';
    let translatedInteractive = translateJson(interactive, ['title','text','label'], lang);
    let allInstructions = this.loadInstructions(lang);

    this.state = {
      leapState: 'initial',
      overlayEnabled: true,
      handleSensitivity: 1,
      springStrength: 1500,
      atomMass: 150,
      draggableAtomMass: 40,
      language: lang,
      allInstructions,
      translatedInteractive,
      leapConnected: false
    }
  }

  loadInstructions(lang){
    let instructions = {
      INITIAL: t('~HEAT_TRANSFER_MICRO_DIRECT_INITIAL', lang),
      ONE_HAND: t('~HEAT_TRANSFER_MICRO_DIRECT_ONE_HAND', lang),
      TWO_HANDS: t('~HEAT_TRANSFER_MICRO_DIRECT_TWO_HANDS', lang),
      ONE_CLOSED_FIST: t('~HEAT_TRANSFER_MICRO_DIRECT_ONE_FIST', lang)
    };
    return instructions;
  }

  handleLeapFrame(frame) {
    return this.fistShake.handleLeapFrame(frame);
  }
    handleDeviceConnected(){
    const { leapConnected } = this.state;
    if (!leapConnected){
      console.log("Device connected in Heat Transfer (micro direct) sim");
      this.setState({leapConnected: true});
    }
  }
  handleDeviceDisconnected(){
    const { leapConnected } = this.state;
    if (leapConnected){
      console.log("Device disconnected in Heat Transfer (micro direct) sim");
      this.setState({leapConnected: false});
    }
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

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
    this.setLabProps(props);
  }

  get gestureCallbacks() {
    return {
      leapState: (data) => {
        if (data.numberOfHands !== 1 || data.numberOfClosedHands !== 1) {
          // Some conditions are not met.
          if (data.numberOfHands === 0) {
            this.setLeapState('initial');
          } else if (data.numberOfHands === 1) {
            this.setLeapState('oneHandDetected');
          } else if (data.numberOfHands === 2) {
            this.setLeapState('twoHandsDetected');
          }
          this.setLabProps({handlePosDiff: {x: 0, y: 0}, keChange: false});

          // Mixin method that updates overlayActive state.
          this.updateOverlayOnGestureNotDetected(data.numberOfHands);
        }
      },
      gestureDetected: (data) => {
        this.setLeapState('oneClosedFist');
        let keChange = data.cooling ? 'decreasing' : 'increasing';
        this.setLabProps({handlePosDiff: {x: data.xDiff, y: data.yDiff}, keChange});

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
      case 'twoHandsDetected':
        return allInstructions.TWO_HANDS;
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
               propsUpdateDelay={16}
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
                <td>{t('~SENSITIVITY', language)}:</td>
                <td>
                  <input type='text' name='handleSensitivity' size='7'
                         value={this.state.handleSensitivity}
                         onChange={this.handleInputChange}/>
                  <input type='range' name='handleSensitivity'
                         min='0' max='3' step='0.1'
                         value={this.state.handleSensitivity}
                         onChange={this.handleInputChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~SPRING_STRENGTH', language)}:</td>
                <td>
                  <input type='text' name='springStrength' size='7'
                         value={this.state.springStrength}
                         onChange={this.handleInputChange}/>
                  <input type='range' name='springStrength'
                         min='0' max='5000' step='1'
                         value={this.state.springStrength}
                         onChange={this.handleInputChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~MASS_DRAGGABLE_ATOM', language)}:</td>
                <td>
                  <input type='text' name='draggableAtomMass' size='7'
                         value={this.state.draggableAtomMass}
                         onChange={this.handleInputChange}/>
                  <input type='range' name='draggableAtomMass'
                         min='1' max='500' step='1'
                         value={this.state.draggableAtomMass}
                         onChange={this.handleInputChange}/>
                </td>
              </tr>
              <tr>
                <td>{t('~MASS_REGULAR_ATOMS', language)}:</td>
                <td>
                  <input type='text' name='atomMass' size='7'
                         value={this.state.atomMass}
                         onChange={this.handleInputChange}/>
                  <input type='range' name='atomMass'
                         min='1' max='500' step='1'
                         value={this.state.atomMass}
                         onChange={this.handleInputChange}/>
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
