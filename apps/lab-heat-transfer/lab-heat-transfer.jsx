import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistShake from './fist-shake';
import avg from '../common/js/tools/avg';
import LeapStatus from '../common/js/components/leap-status.jsx';
import LeapHandsView from '../common/js/components/leap-hands-view.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import './lab-heat-transfer.less'

const TEMP_MULT = 115; // freq * temp mult = new target temperature
const MAX_TEMP = 600;
const MIN_TEMP = 30;
const FREQ_AVG = 120;
const DEF_LAB_PROPS = {
  markedBlock: 'none',
  leftAtomsTargetTemp: 150,
  rightAtomsTargetTemp: 150
};

const MIN_FREQ_TO_HIDE_INSTRUCTIONS = 1;
const IFRAME_WIDTH = 610;
const IFRAME_HEIGHT = 350;

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
    this.resetHandTimeoutChanged = this.resetHandTimeoutChanged.bind(this);
    this.state = {
      leapState: 'initial',
      overlayVisible: true,
      gestureEverDetected: false
    }
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
    // Reset Lab properties when model is reloaded.
    this.setLabProps(DEF_LAB_PROPS);
    this.setState({overlayVisible: true, gestureEverDetected: false})
  }

  resetHandTimeoutChanged(event) {
    this.fistShake.config.resetHandTimeout = event.target.value;
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

          if (data.numberOfHands > 0) {
            // Show overlay if user keeps his hands over the Leap.
            this.setState({overlayVisible: true});
          } else if (this.state.gestureEverDetected) {
            // But hide it if user removes hands and gesture has been detected before.
            // This might be useful when user simply wants to watch the simulation.
            this.setState({overlayVisible: false});
          }
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

        if (avgFreq > MIN_FREQ_TO_HIDE_INSTRUCTIONS) {
          this.setState({overlayVisible: false, gestureEverDetected: true});
        }
      }
    };
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hand (left or right) steady above the Leap device';
      case 'oneHandDetected':
        return 'Close your fist';
      case 'closedHand':
        return 'Shake your hand';
    }
  }

  render() {
    const { overlayVisible } = this.state;
    return (
      <div>
        <div className='container'>
          <Lab ref='labModel' interactive={interactive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={75}
               props={this.state.labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <div className={`overlay ${overlayVisible ? '' : 'hidden'}`}>
            <LeapHandsView width={IFRAME_WIDTH} height={IFRAME_HEIGHT - 3}/>
            <div className='instructions'>
              {this.getStateMsg()}
            </div>
          </div>
        </div>
        <LeapStatus ref='status'>
        <p>
          Sound: <input type='checkbox' name='soundEnabled'
                        defaultChecked={this.fistShake.config.soundEnabled}
                        onChange={this.soundEnabledChanged}/>
        </p>
        <p>
          "No hand" required duration [ms]: <input type='text' name='clearHandTimeout'
                                                   defaultValue={this.fistShake.config.resetHandTimeout}
                                                   onChange={this.resetHandTimeoutChanged}/>
        </p>
        </LeapStatus>
      </div>
    );
  }
}

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
