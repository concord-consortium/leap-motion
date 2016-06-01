import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistBump from './fist-bump';
import avg from '../common/js/tools/avg';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import LeapStatus from '../common/js/components/leap-status.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import introSrc from './intro.gif';
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
  markerSensitivity: 1
};

const MIN_FREQ_TO_HIDE_INSTRUCTIONS = 1;
const IFRAME_WIDTH = 610;
const IFRAME_HEIGHT = 350;

export default class LabVolumePressure extends React.Component {
  constructor(props) {
    super(props);
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.state = {
      numberOfHands: 0,
      overlayVisible: true,
      gestureEverDetected: false
    }
  }

  componentDidMount() {
    this.fistBump = new FistBump({}, this.gestureCallbacks);
  }

  labModelLoaded() {
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
    this.setState({overlayVisible: true, gestureEverDetected: false})
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.value;
    this.setLabProps(props);
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
        this.setState({numberOfHands: leapState.numberOfHands});
        this.plotter.showCanvas(null);

        if (!this.finalGesture) {
          if (leapState.numberOfHands > 0) {
            // Show overlay if user keeps his hands over the Leap.
            this.setState({overlayVisible: true});
          } else if (this.state.gestureEverDetected) {
            // But hide it if user removes hands and gesture has been detected before.
            // This might be useful when user simply wants to watch the simulation.
            this.setState({overlayVisible: false});
          }
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

        if (freq > MIN_FREQ_TO_HIDE_INSTRUCTIONS) {
          this.setState({overlayVisible: false, gestureEverDetected: true});
        }
      }
    };
  }

  handleLeapFrame(frame) {
    return this.fistBump.handleLeapFrame(frame);
  }

  getStateMsg() {
    let state = this.state.labProps;
    if (!state.plungerHighlighted && !state.atomsHighlighted) {
      return 'Rotate one hand.';
    }
    if (state.plungerHighlighted && !state.atomsHighlighted) {
      return 'Make a fist with the other hand.';
    }
    if (!state.plungerHighlighted && state.atomsHighlighted) {
      return 'Rotate one hand.';
    }
    if (state.plungerHighlighted && state.atomsHighlighted) {
      return 'Tap fist to palm. Try fast and slow.';
    }
  }

  render() {
    const { overlayVisible, labProps, numberOfHands } = this.state;
    const introVisible = overlayVisible && numberOfHands === 0;
    const textVisible = overlayVisible && numberOfHands > 0;
    return (
      <div>
        <div className='container'>
          <Lab ref='labModel' interactive={interactive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={75}
               props={labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <InstructionsOverlay visible={overlayVisible} width={IFRAME_WIDTH} height={IFRAME_HEIGHT - 3}>
            <img className={introVisible ? 'intro' : 'intro hidden'} src={introSrc}/>
            <p className='text'>{textVisible && this.getStateMsg()}</p>
          </InstructionsOverlay>
        </div>
        <LeapStatus ref='status'>
          <table>
            <tbody>
            <tr>
              <td>Number of bump spots:</td>
              <td>
                <input type='text' name='markersCount' size='7'
                       value={this.state.labProps.markersCount || 0}
                       onChange={this.handleInputChange}/>
                <input type='range' name='markersCount'
                       min='0' max='25'
                       value={this.state.labProps.markersCount || 0}
                       onChange={this.handleInputChange}/>
              </td>
            </tr>
            <tr>
              <td>Bump spot fade speed:</td>
              <td>
                <input type='text' name='markerFadeSpeed' size='7'
                       value={this.state.labProps.markerFadeSpeed || 0}
                       onChange={this.handleInputChange}/>
                <input type='range' name='markerFadeSpeed'
                       min='0.005' max='0.075' step='0.005'
                       value={this.state.labProps.markerFadeSpeed || 0}
                       onChange={this.handleInputChange}/>
              </td>
            </tr>
            <tr>
              <td>Bump spot sensitivity:</td>
              <td>
                <input type='text' name='markerSensitivity' size='7'
                       value={this.state.labProps.markerSensitivity || 0}
                       onChange={this.handleInputChange}/>
                <input type='range' name='markerSensitivity'
                       min='0.1' max='5' step='0.1'
                       value={this.state.labProps.markerSensitivity || 0}
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

reactMixin.onClass(LabVolumePressure, pureRender);
reactMixin.onClass(LabVolumePressure, leapStateHandlingV2);
reactMixin.onClass(LabVolumePressure, setLabProps);
