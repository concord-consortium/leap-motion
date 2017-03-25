import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import FistBump from './fist-bump';
import avg from '../common/js/tools/avg';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import LeapStatus from '../common/js/components/leap-status.jsx';
import Dialog from '../common/js/components/dialog.jsx';
import interactive from './lab-interactive.json';
import phantomHands from './phantom-hands';
import model from './lab-model.json';
import About from './about.jsx';
import './lab-voule-pressure.less';

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
    this.state = {
      leapState: {},
      overlayEnabled: true
    }
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
    switch(this.getHintName()) {
      case 'noHands': return 'Place hands six inches over the Leap controller.';
      case 'handMissing': return 'Place two hands over the Leap controller.';
      case 'rotate': return 'Rotate one hand to become the plunger.';
      case 'fist': return 'Make a fist with the other hand to become the molecules.';
      default: return 'Tap fist to palm to show how often the molecules hit.';
    }
  }

  render() {
    const { aboutVisible, settingsVisible } = this.props;
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
          <InstructionsOverlay visible={overlayVisible} width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
                               handsViewProps={{phantomHands: phantomHands[overlayVisible && this.getHintName()]}}>
            <div className='instructions'>
              <p className='text'>{this.getHintText()}</p>
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
              <td>Plunger rod visible:</td>
              <td>
                <input type='checkbox' name='plungerRodVisible' checked={labProps.plungerRodVisible || false} onChange={this.handleLabPropChange}/>
              </td>
            </tr>
            <tr>
              <td>Number of bump spots:</td>
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
              <td>Bump spot fade speed:</td>
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
              <td>Bump spot sensitivity:</td>
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
        </LeapStatus>
        <Dialog visible={aboutVisible}>
          <About />
        </Dialog>
      </div>
    );
  }
}

reactMixin.onClass(LabVolumePressure, pureRender);
reactMixin.onClass(LabVolumePressure, leapStateHandlingV2);
reactMixin.onClass(LabVolumePressure, setLabProps);
reactMixin.onClass(LabVolumePressure, overlayVisibility);
