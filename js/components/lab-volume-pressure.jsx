import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import FistBump from '../gestures/fist-bump';
import avg from '../tools/avg';
import iframePhone from 'iframe-phone';
import LeapStandardInfo from './leap-standard-info.jsx';

const MAX_VOL = 0.82;
const MIN_VOL = 0.1;

export default class LabVolumePressure extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
    this.setupLabCommunication();
    this.volume = MAX_VOL;
    this.volumeUpdateIntID = setInterval(function () {
      this.labPhone.post('set', { name: 'volume', value: this.volume });
    }.bind(this), 75);
  }

  componentWillUnmount() {
    this.labPhone.disconnect();
    clearInterval(this.volumeUpdateIntID);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  setupLabCommunication() {
    this.labPhone = new iframePhone.ParentEndpoint(this.refs.labModel);
    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
    }.bind(this));
  }

  gestureDetected() {
    avg.addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
    let maxVelAvg = avg.getAvg('maxVel') || 0;
    this.volume = Math.max(MIN_VOL, Math.min(MAX_VOL, MAX_VOL - this.props.volumeMult * maxVelAvg));
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
        return 'Move your closed fist towards open palm and back rapidly.';
    }
  }

  render() {
    return (
      <div>
        <div>
          <iframe ref='labModel' width='610px' height='350px' frameBorder='0' src='http://lab.concord.org/embeddable.html#interactives/grasp/volume-pressure-relationship.json'/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

LabVolumePressure.defaultProps = {
  volumeMult: 0.0009,
  maxVelAvg: 120,
  handBumpConfig: {
    closedGrabStrength: 0.4,
    openGrabStrength: 0.7,
    handTwistTolerance: 0.7,
    minAmplitude: 5
  }
};

reactMixin.onClass(LabVolumePressure, leapStateHandling);
