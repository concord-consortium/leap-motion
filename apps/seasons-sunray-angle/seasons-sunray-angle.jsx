import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import GesturesHelper from './gestures-helper';
import ModelController from './model-controller';
import {Seasons} from 'grasp-seasons';

const SUNRAY_INACTIVE_COLOR = '#888';
const SUNRAY_NORMAL_COLOR = 'orange';

const GROUND_NORMAL_COLOR = 'auto';
const GROUND_INACTIVE_COLOR = '#888';

const INSTRUCTIONS = {
  INITIAL_GROUND: 'Use one hand to set sunray angle or two hands to set distance between rays.',
  INITIAL_SPACE: 'Use two hands to set ground angle or distance between rays.',
  RAYS_HIGHLIGHTED_SPACE: 'Now add the second hand to set angle of the ground.',
  ONE_HAND_GROUND: 'Please keep you hand steady above the Leap device.',
  ONE_HAND_SPACE: 'Use two hands to set ground angle or distance between rays.',
  TWO_HANDS_GROUND: 'Please keep you hands vertical.',
  TWO_HANDS_SPACE: 'Please keep you hands vertical to set distance between rays or use left hand to set ground angle' +
                   'while right hand should represent rays (point left).',
  ROTATE_GROUND: 'Rotate your hand to set the sunray angle.',
  ROTATE_SPACE: 'Rotate your hand to set the ground angle.',
  DISTANCE: 'Your hands represent distance between rays.'
};

export default class SeasonsSunrayAngle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRaysView: 'ground',
      instructions: INSTRUCTIONS.INITIAL_GROUND
    };
    this.modelController = new ModelController({
      activeRayViewChanged: this.activeRaysViewChanged.bind(this)
    });
    this.gesturesHelper = new GesturesHelper();
    this.handleConfigChange = this.handleConfigChange.bind(this);
  }

  componentDidMount() {
    this.modelController.setupModelCommunication(this.refs.seasonsModel);
  }

  handleConfigChange(event) {
    this.gesturesHelper.config[event.target.name] = event.target.value;
  }

  activeRaysViewChanged(viewName) {
    this.setState({activeRaysView: viewName})
  }

  setInstructions(text) {
    if (this.state.instructions !== text) {
      this.setState({instructions: text});
    }
  }

  setSeasonsState(groundActive, raysActive, distMarker, buttonsActive) {
    this.modelController.setSeasonsState({
      groundColor: groundActive ? GROUND_NORMAL_COLOR : GROUND_INACTIVE_COLOR,
      sunrayColor: raysActive ? SUNRAY_NORMAL_COLOR : SUNRAY_INACTIVE_COLOR,
      sunrayDistMarker: distMarker
    });
    this.modelController.setAnimButtonsDisabled(!buttonsActive);
  }

  handleLeapFrame(frame) {
    const data = this.gesturesHelper.processLeapFrame(frame);
    if (this.state.activeRaysView === 'space') {
      this.handleSpaceViewGestures(data);
    } else { // ground view
      this.handleGroundViewGestures(data);
    }
  }

  handleSpaceViewGestures(data) {
    if (data.numberOfHands === 0) {
      this.setSeasonsState(false, false, false, true);
      this.setInstructions(INSTRUCTIONS.INITIAL_SPACE);
    } else if (data.numberOfHands === 1 && data.rightHandPointingLeft) {
      // Highlight rays.
      this.setSeasonsState(false, true, false, true);
      this.setInstructions(INSTRUCTIONS.RAYS_HIGHLIGHTED_SPACE);
    } else if (data.numberOfHands === 1) {
      // Everything inactive.
      this.setSeasonsState(false, false, false, true);
      this.setInstructions(INSTRUCTIONS.INITIAL_SPACE);
    } else if (data.numberOfHands === 2 && data.rightHandPointingLeft) {
      // Try to set angle, feedback depends on whether angle was updated or not (user needs to stay within given
      // range around the current angle).
      const angleChanged = this.modelController.setHandAngle(data.leftHandAngle);
      this.setSeasonsState(angleChanged, true, false, false);
      this.setInstructions(INSTRUCTIONS.ROTATE_SPACE);
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      const distanceChanged = this.modelController.setHandDistance(data.handsDistance);
      this.setSeasonsState(distanceChanged, distanceChanged, true, false);
      this.setInstructions(INSTRUCTIONS.DISTANCE);
    } else if (data.numberOfHands === 2) {
      // Everything inactive.
      this.setSeasonsState(false, false, false, true);
      this.setInstructions(INSTRUCTIONS.TWO_HANDS_SPACE);
    }
  }

  handleGroundViewGestures(data) {
    if (data.numberOfHands === 0) {
      // Sunrays inactive.
      this.setSeasonsState(true, false, false, true);
      this.setInstructions(INSTRUCTIONS.INITIAL_GROUND);
    } else if (data.numberOfHands === 1 && data.handStill) {
      // Try to set angle, feedback depends on whether angle was updated or not (user needs to stay within given
      // range around the current angle).
      const angleChanged = this.modelController.setHandAngle(data.handAngle);
      this.setSeasonsState(true, angleChanged, false, false);
      this.setInstructions(INSTRUCTIONS.ROTATE_GROUND);
    } else if (data.numberOfHands === 1) {
      // Sunrays inactive.
      this.setSeasonsState(true, false, false, true);
      this.setInstructions(INSTRUCTIONS.ONE_HAND_GROUND);
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      const distanceChanged = this.modelController.setHandDistance(data.handsDistance);
      this.setSeasonsState(true, distanceChanged, true, false);
      this.setInstructions(INSTRUCTIONS.DISTANCE);
    } else if (data.numberOfHands === 2) {
      // Sunrays inactive.
      this.setSeasonsState(true, false, false, true);
      this.setInstructions(INSTRUCTIONS.TWO_HANDS_GROUND);
    }
  }

  render() {
    const { instructions } = this.state;
    return (
      <div>
        <div style={{background: '#f6f6f6', width: '1210px'}}>
          <Seasons ref='seasonsModel'></Seasons>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={instructions}/>
        <p>
          Min distance between hands [mm]: <input type='text' name='minDist'
                                                  defaultValue={this.gesturesHelper.config.minDist}
                                                  onChange={this.handleConfigChange}/>
        </p>
        <p>
          Max distance between hands [mm]: <input type='text' name='maxDist'
                                                  defaultValue={this.gesturesHelper.config.maxDist}
                                                  onChange={this.handleConfigChange}/>
        </p>
      </div>
    );
  }
}

reactMixin.onClass(SeasonsSunrayAngle, leapStateHandlingV2);
