import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import FistBump from '../gestures/fist-bump';
import avg from '../tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from './leap-standard-info.jsx';

export default class LabTemperatureDelta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tempChange: 'none'
    }
  }

  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
    this.setupLabCommunication();
  }
  
  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  setupLabCommunication() {
    // Leap works only when window is active.
    // We can easily loose focus when when user interacts with Lab model.
    setInterval(function () {
      window.focus();
    }, 500);

    this.labTemperature = null;
    this.labPhone = new iframePhone.ParentEndpoint(React.findDOMNode(this.refs.labModel));

    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
      this.labPhone.post('observe', 'targetTemperature');
    }.bind(this));

    this.labPhone.addListener('propertyValue', function (data) {
      if (data.name == 'targetTemperature') {
        this.labTemperature = data.value;
      }
    }.bind(this));
  }

  gestureDetected() {
    avg.addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
    let maxVelAvg = avg.getAvg('maxVel');
    let newTemp = null;
    if (maxVelAvg > this.props.tempIncreaseVel) {
      newTemp = Math.min(5000, this.labTemperature + 10);
      this.setState({tempChange: 'increasing'});
    } else if (maxVelAvg < this.props.tempDecreaseVel) {
      newTemp = Math.max(0, this.labTemperature - 10);
      this.setState({tempChange: 'decreasing'});
    } else {
      this.setState({tempChange: 'none'});
    }
    if (newTemp) {
      this.labPhone.post('set', { name: 'targetTemperature', value: newTemp });
    }
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('max velocity avg', maxVelAvg, {min: 0, max: 1500, precision: 2});
    this.plotter.update();
  }

  nextLeapState(stateId, frame, data) {
    return this.fistBump.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep your hands steady above the Leap device.';
      case 'twoHandsDetected':
        return 'Close one fist and twist the other hand.';
      case 'gestureDetected':
        if (this.state.tempChange === 'none')
          return (
            <p>
              Move your closed fist towards open palm and back rapidly to increase the temperature (velocity
              > { Math.round(this.props.tempIncreaseVel) }). Do it slowly to decrease the temperature
              (velocity &lt; { Math.round(this.props.tempDecreaseVel) }).
            </p>
          );
        if (this.state.tempChange === 'increasing')
          return 'Temperature is increasing (velocity > ' + Math.round(this.props.tempIncreaseVel) + ').';
        if (this.state.tempChange === 'decreasing')
          return 'Temperature is decreasing (velocity < ' + Math.round(this.props.tempDecreaseVel) + ').';
    }
  }

  render() {
    return (
      <div>
        <div>
          <iframe ref='labModel' width='610px' height='350px' frameBorder='0' src='http://lab.concord.org/embeddable.html#interactives/grasp/temperature-pressure-relationship.json'/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

LabTemperatureDelta.defaultProps = {
  tempIncreaseVel: 600,
  tempDecreaseVel: 400,
  maxVelAvg: 120,
  handBumpConfig: {
    closedGrabStrength: 0.4,
    openGrabStrength: 0.7,
    handTwistTolerance: 0.7,
    minAmplitude: 5
  }
};

reactMixin.onClass(LabTemperatureDelta, leapStateHandling);
