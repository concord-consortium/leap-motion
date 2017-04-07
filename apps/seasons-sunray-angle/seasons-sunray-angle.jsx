import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import overlayVisibility from '../common/js/mixins/overlay-visibility';
import InstructionsOverlay from '../common/js/components/instructions-overlay.jsx';
import logger from '../common/js/tools/logger';
import LoggingConfig from '../common/js/components/logging-config.jsx';
import SettingsDialog from '../common/js/components/settings-dialog.jsx';
import AboutDialog from '../common/js/components/about-dialog.jsx';
import About from './about.jsx';
import phantomHands from './phantom-hands';
import GesturesHelper from './gestures-helper';
import GesturesLogger from './gestures-logger';
import ModelController from './model-controller';
import {Seasons} from 'grasp-seasons';
import getURLParam from '../common/js/tools/get-url-param';

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
  INITIAL_SPACE: 'Use one hand to set ground angle or two hands to set distance between rays.',
  TWO_HANDS: 'Please keep you hands vertical.',
  ROTATE_GROUND: 'Rotate your hand to show the sunray angle.',
  ROTATE_SPACE: 'Rotate your hand to show the ground angle.',
  DISTANCE: 'Change the distance between your hands to show the distance between rays.'
};

const OVERLAY_SIZE = {
  'main': {width: '795px', height: '600px'},
  'small-top': {width: '395px', height: '296px'},
  'small-bottom': {width: '395px', height: '296px'}
};
const OVERLAY_SIZE_NARROW = {
  'main': {width: '600px', height: '495px'},
  'small-top': {width: '335px', height: '245px'},
  'small-bottom': {width: '335px', height: '245px'}
};


export default class SeasonsSunrayAngle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRaysView: 'ground',
      activeViewPanel: 'small-top',
      instructions: INSTRUCTIONS.INITIAL_GROUND,
      overlayEnabled: true,
      phantomHandsHint: null,
      renderSize: getURLParam('simulation') || 'seasons'
    };
    this.modelController = new ModelController({
      activeRayViewChanged: this.activeRaysViewChanged.bind(this),
      activeViewPanelChanged: this.activeViewPanelChanged.bind(this)
    });
    this.gesturesHelper = new GesturesHelper();
    this.gesturesLogger = new GesturesLogger();
    this.handleConfigChange = this.handleConfigChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSimStateChange = this.handleSimStateChange.bind(this);
    this.handleViewStateChange = this.handleViewStateChange.bind(this);
    this.handleLoggingStart = this.handleLoggingStart.bind(this);
    this.handleLoggingEnd = this.handleLoggingEnd.bind(this);
    this.log = this.log.bind(this);
  }

  componentDidMount() {
    this.modelController.setSeasonsComponent(this.refs.seasonsModel);
    if (logger.enabled) {
      this.handleLoggingStart();
    }
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
    this.gesturesLogger.logGesture(data, gestureDetected, this.modelController.seasonsState.day);
  }

  updateOverlayVisibility(data, gestureDetected) {
    if (gestureDetected) {
      // Mixin method that updates overlayActive state.
      this.updateOverlayOnGestureDetected();
    } else {
      // Mixin method that updates overlayActive state.
      this.updateOverlayOnGestureNotDetected(data.numberOfHands);
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

  handleSimStateChange(state) {
    this.modelController.handleSimStateChange(state);
  }

  handleViewStateChange(state) {
    this.modelController.handleViewStateChange(state);
  }

  getBasicLogParams() {
    return {
      sim: this.modelController.seasonsState,
      view: this.modelController.seasonsView,
      leapControlledView: this.modelController.activeRaysView
    };
  }

  handleLoggingStart() {
    logger.log('LoggingStarted', this.getBasicLogParams());
    this._loggingStarted = Date.now();
  }

  handleLoggingEnd() {
    const params = this.getBasicLogParams();
    params.duration = (Date.now() - this._loggingStarted) / 1000;
    logger.log('LoggingFinished', params);
  }

  log(action, data) {
    if (action === 'ViewsRearranged') {
      data.leapControlledView = this.modelController.activeRaysView;
    }
    logger.log(action, data);
  }

  render() {
    const { instructions, activeViewPanel, overlayEnabled, overlayActive, phantomHandsHint, renderSize } = this.state;
    let overlaySizeSettings = renderSize == 'seasons' ? OVERLAY_SIZE : OVERLAY_SIZE_NARROW;
    let containerStyle = renderSize == 'seasons' ? 'seasons-container' : 'seasons-container-narrow';
    // Each time user changes position of the rays view, we need to reposition and resize overlay.
    // Position is updated using CSS styles (set by class name, see seasons-sunray-angle.less).
    // Width and height need to be set using React properties, so overlay component can resize its 3D renderer.
    const overlayWidth = overlaySizeSettings[activeViewPanel].width;
    const overlayHeight = overlaySizeSettings[activeViewPanel].height;
    const overlayClassName = `grasp-seasons ${activeViewPanel}`;
    const overlayVisible = overlayEnabled && overlayActive;

    return (
      <div>
        <div className={containerStyle}>
          <div style={{background: '#f6f6f6', width: '1210px'}}>
            <Seasons ref='seasonsModel' initialState={INITIAL_SEASONS_STATE}
                     onSimStateChange={this.handleSimStateChange} onViewStateChange={this.handleViewStateChange} f
                     logHandler={this.log}/>
          </div>
          <InstructionsOverlay visible={overlayVisible} className={overlayClassName}
                               width={overlayWidth} height={overlayHeight}
                               handsViewProps={{positionOffset: [0, -150, 0],
                                                cameraPosition: [0, 100, 500],
                                                phantomHands: phantomHands[overlayVisible && phantomHandsHint]}}>
            <div className='instructions'>
              {instructions}
            </div>
          </InstructionsOverlay>
        </div>
        <div className='top-links'>
          <SettingsDialog>
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
            <LoggingConfig onStart={this.handleLoggingStart} onEnd={this.handleLoggingEnd}/>
          </SettingsDialog>
          <AboutDialog>
            <About />
          </AboutDialog>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(SeasonsSunrayAngle, leapStateHandlingV2);
reactMixin.onClass(SeasonsSunrayAngle, overlayVisibility);
