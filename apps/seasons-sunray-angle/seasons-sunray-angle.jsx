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
import ActiveViewSelector from './active-view-selector';

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
  DISTANCE: 'Change the distance between your hands to show the distance between rays.',
  INITIAL_ORBIT: 'Extend one hand over the controller',
  ORBIT_CONTROL: 'Rotate your hand in-line with the axis of the Earth',
  ORBIT: 'Move your hand around the controller to make the Earth orbit the sun'
};

const OVERLAY_SIZE = {
  'main': {width: '795px', height: '600px'},
  'small-top': {width: '395px', height: '296px'},
  'small-bottom': {width: '395px', height: '296px'}
};
const OVERLAY_SIZE_NARROW = {
  'main': {width: '540px', height: '475px'},
  'small-top': {width: '357px', height: '235px'},
  'small-bottom': {width: '357px', height: '235px'}
};

const DEFAULT_ORBIT_STATE = {
  groundActive: false,
  raysActive: false,
  distMarker: false,
  buttonsActive: true,
  orbitViewActive: true
}

const DEFAULT_GROUND_STATE = {
  groundActive: true,
  raysActive: false,
  distMarker: false,
  buttonsActive: true,
  orbitViewActive: false
};

const DEFAULT_SPACE_STATE = {
  groundActive: false,
  raysActive: true,
  distMarker: false,
  buttonsActive: true,
  orbitViewActive: false
};

const DETECTION_TOLERANCE = 20;

export default class SeasonsSunrayAngle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRaysView: 'raysGround',
      activeViewPanel: 'small-top',
      instructions: INSTRUCTIONS.INITIAL_GROUND,
      overlayEnabled: true,
      phantomHandsHint: null,
      renderSize: getURLParam('simulation') || 'seasons',
      previousFrame: null,
      debugMode: getURLParam('debug') && getURLParam('debug') === 'true' || false,
      mousePos: {screenX: 0, screenY: 0, clientX: 0, clientY: 0}
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
    this.handleSelectOverlay = this.handleSelectOverlay.bind(this);
    this.log = this.log.bind(this);
    this.debugMouseMove = this.debugMouseMove.bind(this);
    logger.initializeLaraConnection();
    this.detectionCount = DETECTION_TOLERANCE + 1;
  }

  componentDidMount() {
    this.modelController.setSeasonsComponent(this.refs.seasonsModel);

    if (logger.enabled) {
      this.handleLoggingStart();
    }
    if (this.state.debugMode){
      document.addEventListener('mousemove', this.debugMouseMove)
    }
  }
  componentWillUnmount(){
    document.removeEventListener('mousemove', this.debugMouseMove)
    logger.terminateLaraConnection();
  }
  debugMouseMove(e){
    let pos = e;
    let earthPos = this.refs.seasonsModel.getEarthScreenPosition();
    let rects = document.getElementsByClassName('seasons-container')[0].getBoundingClientRect();

    pos.earthX = earthPos.x/window.devicePixelRatio + rects.left;
    pos.earthY = earthPos.y/window.devicePixelRatio + rects.top;
    this.setState({mousePos: pos});
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
    logger.log('ControlledViewChanged', {
      controlledView: viewName
    });
    this.setState({activeRaysView: viewName})
    this.resetOverlay();
  }

  activeViewPanelChanged(panelName) {
    this.setState({activeViewPanel: panelName})
  }

  setInstructions(text) {
    if (this.state.instructions !== text) {
      this.setState({instructions: text});
    }
  }

  setSeasonsState(nextState){ //groundActive, raysActive, distMarker, buttonsActive, orbitViewActive
    this.modelController.setSeasonsState({
      groundColor: nextState.groundActive ? GROUND_NORMAL_COLOR : GROUND_INACTIVE_COLOR,
      sunrayColor: nextState.raysActive ? SUNRAY_NORMAL_COLOR : SUNRAY_INACTIVE_COLOR,
      sunrayDistMarker: nextState.distMarker
    });
    this.modelController.setAnimButtonsDisabled(!nextState.buttonsActive);
  }

  handleLeapFrame(frame) {
    const { previousFrame, activeRaysView } = this.state;
    const data = this.gesturesHelper.processLeapFrame(frame, previousFrame);
    let gestureDetected = false;
    let orbitGesture = false;

    switch (activeRaysView){
      case 'raysSpace':
        gestureDetected = this.handleSpaceViewGestures(data);
        break;
      case 'raysGround':
        gestureDetected = this.handleGroundViewGestures(data);
        break;
      case 'orbit':
        orbitGesture = true;
        gestureDetected = this.handleOrbitViewGestures(data);
        break;
      default:
        break;
    }

    this.updateOverlayVisibility(data, gestureDetected);
    this.updatePhantomHandsHint(data, gestureDetected);
    this.gesturesLogger.logGesture(data, gestureDetected, this.modelController.seasonsState.day, orbitGesture);
    this.setState({previousFrame: frame});
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
    const { activeRaysView } = this.state;
    if (gestureDetected || data.numberOfHands === 0) {
      this.setState({phantomHandsHint: null});
    } else {
      switch (activeRaysView){
        case 'orbit':
          this.setState({phantomHandsHint: ''});
          break;
        default:
          if (data.numberOfHands === 1 && data.handType === 'left') {
            this.setState({phantomHandsHint: 'angleLeft'});
          } else if (data.numberOfHands === 1 && data.handType === 'right') {
            this.setState({phantomHandsHint: 'angleRight'});
          } else if (data.numberOfHands === 2 && !data.handsVertical) {
            this.setState({phantomHandsHint: 'handsVertical'});
          } else if (data.numberOfHands === 2 && data.handsVertical) {
            this.setState({phantomHandsHint: 'handsMove'});
          }
          break;
      }
    }
  }

  handleSpaceViewGestures(data) {
    let gestureDetected = false;

    if (data.numberOfHands === 0) {
      // Ground inactive.
      this.setSeasonsState(DEFAULT_SPACE_STATE);
      this.setInstructions(INSTRUCTIONS.INITIAL_SPACE);
    } else if (data.numberOfHands === 1 && data.handStill) {
      // Try to set angle, feedback depends on whether angle was updated or not (user needs to stay within given
      // range around the current angle).
      const angleChanged = this.modelController.setHandAngle(data.handAngle, this.state.activeRaysView);

      let nextSeasonsState = Object.assign({}, DEFAULT_SPACE_STATE);
      nextSeasonsState.groundActive = angleChanged;
      nextSeasonsState.raysActive = angleChanged;
      nextSeasonsState.buttonsActive = false;
      this.setSeasonsState(nextSeasonsState);
      this.setInstructions(INSTRUCTIONS.ROTATE_SPACE);
      gestureDetected = angleChanged;
    } else if (data.numberOfHands === 1) {
      // Hand moving too fast.
      this.setSeasonsState(DEFAULT_SPACE_STATE);
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      const distanceChanged = this.modelController.setHandDistance(data.handsDistance);

      let nextSeasonsState = Object.assign({}, DEFAULT_SPACE_STATE);
      nextSeasonsState.groundActive = distanceChanged;
      nextSeasonsState.raysActive = distanceChanged;
      nextSeasonsState.distMarker = true;
      nextSeasonsState.buttonsActive = false;
      this.setSeasonsState(nextSeasonsState); //distanceChanged, true, true, false, false);

      this.setInstructions(INSTRUCTIONS.DISTANCE);
      gestureDetected = distanceChanged;
    } else if (data.numberOfHands === 2) {
      // Ground inactive.
      this.setSeasonsState(DEFAULT_SPACE_STATE);
      this.setInstructions(INSTRUCTIONS.TWO_HANDS);
    }
    return gestureDetected;
  }

  handleGroundViewGestures(data) {
    let gestureDetected = false;
    let nextSeasonsState = Object.assign({}, DEFAULT_GROUND_STATE);

    if (data.numberOfHands === 0) {
      // Sunrays inactive.
      this.setSeasonsState(DEFAULT_GROUND_STATE);
      this.setInstructions(INSTRUCTIONS.INITIAL_GROUND);
    } else if (data.numberOfHands === 1 && data.handStill) {
      // Try to set angle, feedback depends on whether angle was updated or not (user needs to stay within given
      // range around the current angle).
      const angleChanged = this.modelController.setHandAngle(data.handAngle, this.state.activeRaysView);

      let nextSeasonsState = Object.assign({}, DEFAULT_GROUND_STATE);
      nextSeasonsState.raysActive = angleChanged;
      nextSeasonsState.buttonsActive = false;
      this.setSeasonsState(nextSeasonsState);

      this.setInstructions(INSTRUCTIONS.ROTATE_GROUND);
      gestureDetected = angleChanged;
    } else if (data.numberOfHands === 1) {
      // Hand moving too fast.
      this.setSeasonsState(DEFAULT_GROUND_STATE);
    } else if (data.numberOfHands === 2 && data.handsVertical) {
      const distanceChanged = this.modelController.setHandDistance(data.handsDistance);

      let nextSeasonsState = Object.assign({}, DEFAULT_GROUND_STATE);
      nextSeasonsState.raysActive = distanceChanged;
      nextSeasonsState.distMarker = true;
      nextSeasonsState.buttonsActive = false;
      this.setSeasonsState(nextSeasonsState);
      this.setInstructions(INSTRUCTIONS.DISTANCE);
      gestureDetected = distanceChanged;
    } else if (data.numberOfHands === 2) {
      // Sunrays inactive.
      this.setSeasonsState(DEFAULT_GROUND_STATE);
      this.setInstructions(INSTRUCTIONS.TWO_HANDS);
    }
    return gestureDetected;
  }

  handleOrbitViewGestures(data) {
    const {activeViewPanel} = this.state;

    let gestureDetected = false;
    let count = this.detectionCount ? this.detectionCount : DETECTION_TOLERANCE + 1;

    let handControl = (data.handAngle && data.handAngle > 110 && data.handAngle < 130);
    let handControlEnabled = handControl || count < DETECTION_TOLERANCE;

    if (data.numberOfHands === 0){
      // orbit view inactive.
      this.setSeasonsState(DEFAULT_ORBIT_STATE);
      this.setInstructions(INSTRUCTIONS.INITIAL_ORBIT);
      this.refs.seasonsModel.lockCameraRotation(false);
    } else {
      this.setSeasonsState(DEFAULT_ORBIT_STATE);
      this.refs.seasonsModel.lockCameraRotation(true);
      let p = this.refs.seasonsModel.getEarthScreenPosition();

      if (!handControl){
          count++;
          this.detectionCount = count;
        } else {
          this.detectionCount = 0;
      }

      if (handControlEnabled){
        this.modelController.startOrbitInteraction(p.x, p.y, activeViewPanel);
        this.setInstructions(INSTRUCTIONS.ORBIT);
        if (data.handTranslation){
          // hand is moving
          this.modelController.handleOrbitInteraction(p.x, p.y, data.handTranslation[0], data.handTranslation[2], activeViewPanel);
        }
      }
      else{
        this.modelController.finishOrbitInteraction(p.x, p.y, activeViewPanel);
        this.setInstructions(INSTRUCTIONS.ORBIT_CONTROL);
      }
      gestureDetected = handControlEnabled;
    }
    return gestureDetected;
  }

  handleSimStateChange(state) {
    this.modelController.handleSimStateChange(state);
  }

  handleViewStateChange(state) {
    this.modelController.handleViewStateChange(state);
  }

  handleSelectOverlay(view) {
    // When a user requests Leap control over a view
    logger.log('ControlledViewSelected', {
      controlledView: view.value
    });
    this.setState({activeRaysView: view.value, activeViewPanel: view.className, instructions: ''});
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
    const { instructions, activeViewPanel, activeRaysView, overlayEnabled, overlayActive, phantomHandsHint, renderSize, mousePos, debugMode } = this.state;
    let overlaySizeSettings = renderSize == 'seasons' ? OVERLAY_SIZE : OVERLAY_SIZE_NARROW;
    let containerStyle = renderSize == 'seasons' ? 'seasons-container' : 'seasons-container narrow';
    let activeViewSelectorStyle = renderSize == 'seasons' ? 'active-view-selector' : 'active-view-selector narrow';
    // Each time user changes position of the rays view, we need to reposition and resize overlay.
    // Position is updated using CSS styles (set by class name, see seasons-sunray-angle.less).
    // Width and height need to be set using React properties, so overlay component can resize its 3D renderer.
    const overlayWidth = overlaySizeSettings[activeViewPanel].width;
    const overlayHeight = overlaySizeSettings[activeViewPanel].height;
    const overlayClassName = `grasp-seasons ${activeViewPanel}`;
    const overlayVisible = overlayEnabled && overlayActive;
    const orbitInstructions = overlayVisible && activeRaysView === 'orbit' && phantomHandsHint !== null;

    return (
      <div>
        <h1>Seasons</h1>
        <div className={containerStyle}>
          <div style={{background: '#f6f6f6', width: '1210px'}}>
            <Seasons ref='seasonsModel' initialState={INITIAL_SEASONS_STATE}
                     onSimStateChange={this.handleSimStateChange} onViewStateChange={this.handleViewStateChange}
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
            {orbitInstructions && <img src="./HandOrbit_t.gif" className="handOrbitOverlay" />}
          </InstructionsOverlay>
          <ActiveViewSelector overlays={this.modelController.seasonsView} className={activeViewSelectorStyle}
                              initialOverlays={INITIAL_SEASONS_STATE}
                              activeOverlay={activeViewPanel}
                              onViewOverlayChange={this.handleSelectOverlay} />
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
          {debugMode && mousePos &&
            <div className="debug">
              <div>Mouse positions:<br/>Page:{mousePos.pageX}, {mousePos.pageY}<br/>Client:{mousePos.clientX}, {mousePos.clientY}</div>
              <div>Earth coords:{Math.round(mousePos.earthX)},{Math.round(mousePos.earthY)}</div>
            </div>}

        </div>
      </div>
    );
  }
}

reactMixin.onClass(SeasonsSunrayAngle, leapStateHandlingV2);
reactMixin.onClass(SeasonsSunrayAngle, overlayVisibility);
