import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import Lab from 'react-lab';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import setLabProps from '../common/js/mixins/set-lab-props';
import FistShake from './fist-shake';
import LeapStatus from '../common/js/components/leap-status.jsx';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';
import './lab-heat-transfer-micro-two-atoms.less'

const IFRAME_WIDTH = 510;
const IFRAME_HEIGHT = 400;

export default class LabHeatTransfer extends React.Component {
  constructor(props) {
    super(props);
    this.fistShake = new FistShake({}, this.gestureCallbacks);
    this.labModelLoaded = this.labModelLoaded.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.state = {
      leapState: 'initial',
      overlayEnabled: true,
      overlayVisible: true,
      gestureEverDetected: false,
      handleSensitivity: 1,
      springStrength: 1500,
      atomMass: 150,
      draggableAtomMass: 40
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
    this.setState({overlayVisible: true, gestureEverDetected: false})
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
        if (data.numberOfHands !== 2 || data.numberOfClosedHands !== 2) {
          // Some conditions are not met.
          if (data.numberOfHands === 0) {
            this.setLeapState('initial');
          } else if (data.numberOfHands === 1) {
            this.setLeapState('oneHandDetected');
          } else if (data.numberOfHands === 2) {
            this.setLeapState('twoHandsDetected');
          }
          this.setLabProps({
            handlePosDiff1: {x: 0, y: 0},
            handlePosDiff2: {x: 0, y: 0},
            keChange: false
          });
        }

        if (data.numberOfHands > 0) {
          // Show overlay if user keeps his hands over the Leap.
          this.setState({overlayVisible: true});
        } else if (this.state.gestureEverDetected) {
          // But hide it if user removes hands and gesture has been detected before.
          // This might be useful when user simply wants to watch the simulation.
          this.setState({overlayVisible: false});
        }
      },
      gestureDetected: (data) => {
        this.setLeapState('twoClosedFists');
        let keChange = data.cooling ? 'decreasing' : 'increasing';
        this.setLabProps({
          handlePosDiff1: {x: data.xDiff1, y: data.yDiff1},
          handlePosDiff2: {x: data.xDiff2, y: data.yDiff2},
          keChange
        });
        this.setState({overlayVisible: false, gestureEverDetected: true});
      }
    };
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hands steady above the Leap device';
      case 'oneHandDetected':
        return 'Use two hands';
      case 'twoHandsDetected':
        return 'Close your fists';
      case 'twoClosedFists':
        return 'Shake your fists';
    }
  }

  render() {
    const { overlayEnabled, overlayVisible, labProps } = this.state;
    return (
      <div>
        <div className='container'>
          <Lab ref='labModel' interactive={interactive} model={model}
               width={IFRAME_WIDTH} height={IFRAME_HEIGHT}
               propsUpdateDelay={16}
               props={labProps}
               onModelLoad={this.labModelLoaded}
               playing={true}/>
          <InstructionsOverlay visible={overlayEnabled && overlayVisible} width={IFRAME_WIDTH} height={IFRAME_HEIGHT - 3}>
            {this.getStateMsg()}
          </InstructionsOverlay>
        </div>
        <LeapStatus ref='status'>
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
              <td>Sensitivity:</td>
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
              <td>Spring strength:</td>
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
              <td>Mass of the draggable atom:</td>
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
              <td>Mass of the regular atoms:</td>
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
        </LeapStatus>
      </div>
    );
  }
}

reactMixin.onClass(LabHeatTransfer, pureRender);
reactMixin.onClass(LabHeatTransfer, leapStateHandlingV2);
reactMixin.onClass(LabHeatTransfer, setLabProps);
