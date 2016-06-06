import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import SunrayAngle from './sunray-angle';
import ModelController from './model-controller';
import {Seasons} from 'grasp-seasons';

export default class SeasonsSunrayAngle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRaysView: 'ground'
    };

    this.modelController = new ModelController({
      activeRayViewChanged: this.activeRaysViewChanged.bind(this)
    });
    // Gesture recognition depends on the current mode (ground vs space). Provide function that returns this info
    // and pass it to gesture detection module.
    this.sunrayAngle = new SunrayAngle({
      handAngleDetected: this.handAngleDetected.bind(this),
      twoHandsDistanceDetected: this.twoHandsDistanceDetected.bind(this)
    }, () => this.state.activeRaysView);

    this.handleConfigChange = this.handleConfigChange.bind(this);
  }

  componentDidMount() {
    this.sunrayAngle.plotter = this.plotter;
    this.modelController.setupModelCommunication(this.refs.seasonsModel);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  nextLeapState(stateId, frame, data) {
    return this.sunrayAngle.nextLeapState(stateId, frame, data);
  }

  componentDidUpdate() {
    if (this.state.leapState === 'oneHandAngleDetected' ||
        this.state.leapState === 'twoHandsAngleDetected' ||
        this.state.leapState === 'twoHandsDistanceDetected') {
      this.modelController.setAnimButtonsDisabled(true);
    } else {
      this.modelController.setAnimButtonsDisabled(false);
      this.modelController.setViewInactive();
    }
  }

  handleConfigChange(event) {
    this.sunrayAngle.config[event.target.name] = event.target.value;
  }

  getStateMsg() {
    const groundViewActive = this.state.activeRaysView === 'ground';
    switch(this.state.leapState) {
      case 'initial':
        if (groundViewActive) return 'Use one hand to set sunray angle or two hands to set distance between rays.';
        else return 'Use two hands to set ground angle or distance between rays.';
      case 'oneHandDetected':
        if (groundViewActive) return 'Please keep you hand steady above the Leap device.';
        else return 'Use two hands to set ground angle or distance between rays.';
      case 'twoHandsDetected':
        if (groundViewActive) return 'Please keep you hands vertical.';
        else return 'Please keep you hands vertical to set distance between rays or use left hand to set ground angle' +
                    'while right hand should represent rays (point left).';
      case 'oneHandAngleDetected':
      case 'twoHandsAngleDetected':
        return 'Rotate your hand to set the sun angle.';
      case 'twoHandsDistanceDetected':
        return 'Your hands represent distance between rays.';
    }
  }

  activeRaysViewChanged(viewName) {
    this.setState({activeRaysView: viewName})
  }

  handAngleDetected(angle) {
    this.modelController.setHandAngle(angle);
  }

  twoHandsDistanceDetected(dist) {
    this.modelController.setHandDistance(dist);
  }

  render() {
    return (
      <div>
        <div style={{background: '#f6f6f6', width: '1210px'}}>
          <Seasons ref='seasonsModel'></Seasons>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
        <p>
          Min distance between hands [mm]: <input type='text' name='minDist'
                                                   defaultValue={this.sunrayAngle.config.minDist}
                                                   onChange={this.handleConfigChange}/>
        </p>
        <p>
          Max distance between hands [mm]: <input type='text' name='maxDist'
                                                  defaultValue={this.sunrayAngle.config.maxDist}
                                                  onChange={this.handleConfigChange}/>
        </p>
      </div>
    );
  }
}

reactMixin.onClass(SeasonsSunrayAngle, leapStateHandling);
