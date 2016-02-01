import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import FistBump from '../common/js/gestures/fist-bump';
import avg from '../common/js/tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';

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
    this.labPhone = new iframePhone.ParentEndpoint(this.refs.labModel);
    this.labTemperature = 460;
    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
    }.bind(this));
  }

  gestureDetected() {
    avg.addSample('freq', this.fistBump.freq, Math.round(this.props.freqAvg));
    let freq = avg.getAvg('freq');
    let newTemp = null;
    if (freq > this.props.tempIncreaseFreq) {
      newTemp = Math.min(5000, this.labTemperature + 7);
      this.setState({tempChange: 'increasing'});
    } else if (freq < this.props.tempDecreaseFreq) {
      newTemp = Math.max(0, this.labTemperature - 7);
      this.setState({tempChange: 'decreasing'});
    } else {
      this.setState({tempChange: 'none'});
    }
    if (newTemp) {
      this.labPhone.post('set', { name: 'targetTemperature', value: newTemp });
      this.labTemperature = newTemp;
    }
    this.plotter.showCanvas('gesture-detected');
    this.plotter.plot('frequency', freq, {min: 0, max: 9, precision: 2});
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
              Move your closed fist towards open palm and back rapidly to increase the temperature (frequency
              > { Math.round(this.props.tempIncreaseFreq) }). Do it slowly to decrease the temperature
              (frequency &lt; { Math.round(this.props.tempDecreaseFreq) }).
            </p>
          );
        if (this.state.tempChange === 'increasing')
          return 'Temperature is increasing (frequency > ' + Math.round(this.props.tempIncreaseFreq) + ').';
        if (this.state.tempChange === 'decreasing')
          return 'Temperature is decreasing (frequency < ' + Math.round(this.props.tempDecreaseFreq) + ').';
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
  tempIncreaseFreq: 4,
  tempDecreaseFreq: 2,
  maxVelAvg: 120,
  handBumpConfig: {
    // use defaults
  }
};

reactMixin.onClass(LabTemperatureDelta, leapStateHandling);
