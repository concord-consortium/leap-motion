import React from 'react';
import reactMixin from 'react-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistBump from './fist-bump';
import avg from '../common/js/tools/avg';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

const MAX_VOL = 0.82;
const MIN_VOL = 0.1;
const VOLUME_MULT = 0.11;

const DEF_LAB_PROPS = {
  volume: MAX_VOL,
  orientation: 'right',
  plungerHighlighted: false,
  atomsHighlighted: false
};

export default class LabVolumePressure extends React.Component {
  constructor(props) {
    super(props);
    this.labModelLoaded = this.labModelLoaded.bind(this);
  }

  componentDidMount() {
    this.fistBump = new FistBump({}, this.gestureCallbacks);
  }

  labModelLoaded() {
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  get gestureCallbacks() {
    return {
      leapState: (leapState) => {
        let labProps = {};
        if (leapState.verticalHand) {
          labProps.orientation = leapState.verticalHand.type;
        }
        labProps.plungerHighlighted = !!leapState.verticalHand;
        labProps.atomsHighlighted = !!leapState.closedHand &&
          leapState.closedHand.type !== this.state.labProps.orientation;
        this.setLabProps(labProps);
        this.plotter.showCanvas(null);
      },
      gestureDetected: (freqSample) => {
        avg.addSample('freq', freqSample, Math.round(this.props.freqAvg));
        let freq = avg.getAvg('freq');
        let volume = Math.max(MIN_VOL, Math.min(MAX_VOL, MAX_VOL - VOLUME_MULT * freq));

        this.plotter.showCanvas('gesture-detected');
        this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
        this.plotter.update();

        this.setLabProps({volume: volume});
      }
    };
  }

  handleLeapFrame(frame) {
    return this.fistBump.handleLeapFrame(frame);
  }

  getStateMsg() {
    let state = this.state.labProps;
    if (!state.plungerHighlighted && !state.atomsHighlighted) {
      return 'Twist one hand and keep it vertical.';
    }
    if (state.plungerHighlighted && !state.atomsHighlighted) {
      return 'Close the other fist.';
    }
    if (!state.plungerHighlighted && state.atomsHighlighted) {
      return 'Twist the other hand and keep it vertical.';
    }
    if (state.plungerHighlighted && state.atomsHighlighted) {
      return 'Move your closed fist towards open palm and back rapidly.';
    }
  }

  render() {
    return (
      <div>
        <div>
          <Lab ref='labModel' interactive={interactive} model={model}
               width='610px' height='350px'
               propsUpdateDelay={75}
               props={this.state.labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

reactMixin.onClass(LabVolumePressure, leapStateHandlingV2);
reactMixin.onClass(LabVolumePressure, setLabProps);
