import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import PhantomHands from './phantom-hands.jsx';
import GesturesHelper from './gestures-helper';
import ModelController from './model-controller';
import {Seasons} from 'grasp-seasons';
import './seasons-sunray-angle.less';

const SUNRAY_INACTIVE_COLOR = '#888';
const SUNRAY_NORMAL_COLOR = 'orange';

const GROUND_NORMAL_COLOR = '#4C7F19';
const GROUND_INACTIVE_COLOR = '#888';

const INITIAL_SEASONS_STATE = {
  view: {
    'main': 'orbit',
    'small-top': 'raysGround',
    'small-bottom': 'nothing'
  }
};

const INSTRUCTIONS = {
  INITIAL_GROUND: 'Use one hand to set sunray angle or two hands to set distance between rays.',
  INITIAL_SPACE: 'Use one hand to set ground angle or distance between rays.',
  TWO_HANDS: 'Please keep you hands vertical.',
  ROTATE_GROUND: 'Rotate your hand to set the sunray angle.',
  ROTATE_SPACE: 'Rotate your hand to set the ground angle.',
  DISTANCE: 'Your hands represent distance between rays.'
};

const OVERLAY_SIZE = {
  'main': {width: '795px', height: '600px'},
  'small-top': {width: '395px', height: '296px'},
  'small-bottom': {width: '395px', height: '296px'}
};

const MIN_GESTURE_TIME = 3000;

export default class SeasonsSunrayAngle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRaysView: 'ground',
      activeViewPanel: 'small-top',
      instructions: INSTRUCTIONS.INITIAL_GROUND,
      overlayEnabled: true,
      overlayVisible: true,
      gestureEverDetected: false,
      gestureDetectedTimestamp: null,
      phantomHandsHint: null
    };
    this.modelController = new ModelController({
      activeRayViewChanged: this.activeRaysViewChanged.bind(this),
      activeViewPanelChanged: this.activeViewPanelChanged.bind(this)
    });
    this.gesturesHelper = new GesturesHelper();
    this.handleConfigChange = this.handleConfigChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    this.modelController.setupModelCommunication(this.refs.seasonsModel);
  }

  handleConfigChange(event) {
    this.gesturesHelper.config[event.target.name] = event.target.value;
  }

  handleInputChange(event) {
    let props = {};
    props[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState(props);
  }

  activeRaysViewChanged(viewName) {
    this.setState({activeRaysView: viewName})
  }

  activeViewPanelChanged(panelName) {
    this.setState({activeViewPanel: panelName})
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
    let gestureDetected = false;
    if (this.state.activeRaysView === 'space') {
      gestureDetected = this.handleSpaceViewGestures(data);
    } else { // ground view
      gestureDetected = this.handleGroundViewGestures(data);
    }

    this.updateOverlayVisibility(data, gestureDetected);
    this.updatePhantomHandsHint(data, gestureDetected);
  }

  updateOverlayVisibility(data, gestureDetected) {
    if (gestureDetected) {
      const { gestureDetectedTimestamp } = this.state;
      if (!gestureDetectedTimestamp) {
        this.setState({gestureDetectedTimestamp: Date.now()});
      }
      if (gestureDetectedTimestamp && Date.now() - gestureDetectedTimestamp > MIN_GESTURE_TIME) {
        // Disable overlay after gesture has been detected for some time.
        this.setState({overlayVisible: false, gestureEverDetected: true});
      }
    } else if (data.numberOfHands > 0) {
      this.setState({overlayVisible: true});
    } else if (this.state.gestureEverDetected) {
      this.setState({overlayVisible: false});
    }
  }

  updatePhantomHandsHint(data, gestureDetected) {
    if (gestureDetected || data.numberOfHands === 0) {
      this.setState({phantomHandsHint: null});
    } else if (data.numberOfHands === 1 && data.handType === 'left') {
      this.setState({phantomHandsHint: 'angleLeft'});
    } else if (data.numberOfHands === 1 && data.handType === 'right') {
      this.setState({phantomHandsHint: 'angleRight'});
    } else if (data.numberOfHands === 2 && !data.handsVertical) {
      this.setState({phantomHandsHint: 'handsVertical'});
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      this.setState({phantomHandsHint: 'handsMove'});
    }
  }


  handleSpaceViewGestures(data) {
    let gestureDetected = false;
    if (data.numberOfHands === 0) {
      // Ground inactive.
      this.setSeasonsState(false, true, false, true);
      this.setInstructions(INSTRUCTIONS.INITIAL_SPACE);
    } else if (data.numberOfHands === 1 && data.handStill) {
      // Try to set angle, feedback depends on whether angle was updated or not (user needs to stay within given
      // range around the current angle).
      const angleChanged = this.modelController.setHandAngle(data.handAngle);
      this.setSeasonsState(angleChanged, true, false, false);
      this.setInstructions(INSTRUCTIONS.ROTATE_GROUND);
      gestureDetected = angleChanged;
    } else if (data.numberOfHands === 1) {
      // Hand moving too fast.
      this.setSeasonsState(false, true, false, true);
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      const distanceChanged = this.modelController.setHandDistance(data.handsDistance);
      this.setSeasonsState(distanceChanged, true, true, false);
      this.setInstructions(INSTRUCTIONS.DISTANCE);
      gestureDetected = distanceChanged;
    } else if (data.numberOfHands === 2) {
      // Ground inactive.
      this.setSeasonsState(false, true, false, true);
      this.setInstructions(INSTRUCTIONS.TWO_HANDS);
    }
    return gestureDetected;
  }

  handleGroundViewGestures(data) {
    let gestureDetected = false;
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
      gestureDetected = angleChanged;
    } else if (data.numberOfHands === 1) {
      // Hand moving too fast.
      this.setSeasonsState(true, false, false, true);
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      const distanceChanged = this.modelController.setHandDistance(data.handsDistance);
      this.setSeasonsState(true, distanceChanged, true, false);
      this.setInstructions(INSTRUCTIONS.DISTANCE);
      gestureDetected = distanceChanged;
    } else if (data.numberOfHands === 2) {
      // Sunrays inactive.
      this.setSeasonsState(true, false, false, true);
      this.setInstructions(INSTRUCTIONS.TWO_HANDS);
    }
    return gestureDetected;
  }

  render() {
    const { instructions, activeViewPanel, overlayEnabled, overlayVisible, phantomHandsHint } = this.state;
    // Each time user changes position of the rays view, we need to reposition and resize overlay.
    // Position is updated using CSS styles (set by class name, see seasons-sunray-angle.less).
    // Width and height need to be set using React properties, so overlay component can resize its 3D renderer.
    const overlayWidth = OVERLAY_SIZE[activeViewPanel].width;
    const overlayHeight = OVERLAY_SIZE[activeViewPanel].height;
    const overlayClassName = `grasp-seasons ${activeViewPanel}`;
    return (
      <div>
        <div style={{background: '#f6f6f6', width: '1210px'}}>
          <Seasons ref='seasonsModel' initialState={INITIAL_SEASONS_STATE}/>
        </div>
        <InstructionsOverlay visible={overlayEnabled && overlayVisible} className={overlayClassName}
                             width={overlayWidth} height={overlayHeight}
                             handsViewProps={{positionOffset: [0, -150, 0], cameraPosition: [0, 100, 500]}}>
          <div className='instructions'>
            {instructions}
          </div>
          <PhantomHands hint={overlayVisible && phantomHandsHint}/>
        </InstructionsOverlay>
        <p>
          Overlay: <input type='checkbox' name='overlayEnabled' checked={overlayEnabled} onChange={this.handleInputChange}/>
        </p>
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
