import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';
import SunrayAngle from './sunray-angle';
import ModelController from './model-controller';

export default class SeasonsSunrayAngle extends React.Component {
  constructor(props) {
    super(props);
    this.sunrayAngle = new SunrayAngle({
      oneHandGestureDetected: this.oneHandGestureDetected.bind(this),
      twoHandsGestureDetected: this.twoHandsGestureDetected.bind(this)
    });
    this.modelController = new ModelController();
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
    if (this.state.leapState === 'oneHandGestureDetected' ||
        this.state.leapState === 'twoHandsGestureDetected') {
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
    switch(this.state.leapState) {
      case 'initial':
        return 'Use one hand to set sunray angle or two hands to set distance between rays.';
      case 'oneHandDetected':
        return 'Please keep you hand steady above the Leap device.';
      case 'twoHandsDetected':
        return 'Please keep you hands vertical.';
      case 'oneHandGestureDetected':
        return 'Rotate your hand to set the sun angle.';
      case 'twoHandsGestureDetected':
        return 'Your hands represent distance between rays.';
    }
  }

  oneHandGestureDetected(angle) {
    this.modelController.setHandAngle(angle);
  }

  twoHandsGestureDetected(dist) {
    this.modelController.setHandDistance(dist);
  }

  render() {
    return (
      <div>
        <iframe ref='seasonsModel' width='1220px' height='830px' scrolling='no' frameBorder='0'
                src='http://models-resources.concord.org/grasp-seasons/version/0.2.0/index.html'></iframe>
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
