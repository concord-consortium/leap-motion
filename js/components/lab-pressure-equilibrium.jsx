import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import FistBump from '../gestures/fist-bump';
import AddRmObj from '../gestures/add-rm-obj';
import LeapStandardInfo from './leap-standard-info.jsx';
import avg from '../tools/avg';
import iframePhone from 'iframe-phone';


export default class LabPressureEquilibrium extends React.Component {
  componentDidMount() {
    this.fistBump = new FistBump(this.props.handBumpConfig, this.fistBumpDetected.bind(this), this.plotter);
    this.addRmObj = new AddRmObj(this.props.addRmAtomConfig, this.addRmAtomDetected.bind(this), this.plotter);
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

    this.purpleAtomTemperature = null;
    this.purpleAtomsCount = null;
    this.yellowAtomTemperature = null;
    this.yellowAtomsCount = null;
    this.labPhone = new iframePhone.ParentEndpoint(this.refs.labModel);

    this.labPhone.addListener('modelLoaded', function () {
      this.labPhone.post('play');
      this.labPhone.post('observe', 'purpleAtomTemperature');
      this.labPhone.post('observe', 'purpleAtomsCount');
      this.labPhone.post('observe', 'yellowAtomTemperature');
      this.labPhone.post('observe', 'yellowAtomsCount');
    }.bind(this));

    this.labPhone.addListener('propertyValue', function (data) {
      if (data.name == 'purpleAtomTemperature') {
        this.purpleAtomTemperature = data.value;
      } else if (data.name == 'purpleAtomsCount') {
        this.purpleAtomsCount = data.value;
      } else if (data.name == 'yellowAtomTemperature') {
        this.yellowAtomTemperature = data.value;
      } else if (data.name == 'yellowAtomsCount') {
        this.yellowAtomsCount = data.value;
      }
    }.bind(this));
  }

  fistBumpDetected() {
    let maxVelAvg = 0;
    if (this.fistBump.hand.type === 'left') {
      avg.addSample('maxVelLeft', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
      maxVelAvg = avg.getAvg('maxVelLeft');
      this.labPhone.post('set', { name: 'purpleAtomTemperature', value: 1 + maxVelAvg * this.props.tempMult });
    } else {
      avg.addSample('maxVelRight', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
      maxVelAvg = avg.getAvg('maxVelRight');
      this.labPhone.post('set', { name: 'yellowAtomTemperature', value: 1 + maxVelAvg * this.props.tempMult });
    }
   this.plotter.showCanvas('gesture-detected');
   this.plotter.plot('max velocity avg', maxVelAvg, {min: 0, max: 1500, precision: 2});
   this.plotter.plot('velocity', this.fistBump.hand.palmVelocity[0]);
   this.plotter.update();
  }

  addRmAtomDetected(data) {
    if (data.removed && data.handType === 'left') {
      this.labPhone.post('set', { name: 'purpleAtomsCount', value: this.purpleAtomsCount - 5 });
    } else if (data.removed && data.handType === 'right') {
      this.labPhone.post('set', { name: 'yellowAtomsCount', value: this.yellowAtomsCount - 5 });
    } else if (data.added && data.handType === 'left') {
      this.labPhone.post('set', { name: 'purpleAtomsCount', value: this.purpleAtomsCount + 5 });
    } else if (data.added && data.handType === 'right') {
      this.labPhone.post('set', { name: 'yellowAtomsCount', value: this.yellowAtomsCount + 5 });
    }
  }

  nextLeapState(stateId, frame, data) {
    return this.fistBump.nextLeapState(stateId, frame, data) || this.addRmObj.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Use one hand to add or remove atoms, use two hands to heat up or cool down atoms.';
      case 'oneHandDetected':
        return (
          <div>
            <p>Close your hand, move it <b>up</b> and open to <b>remove</b> an atom.</p>
            <p>Close your hand, move it <b>down</b> and open to <b>add</b> an atom.</p>
          </div>
        );
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
          <iframe ref='labModel' width='610px' height='350px' frameBorder='0' src='http://lab.concord.org/embeddable.html#interactives/grasp/pressure-equilibrium.json'/>
        </div>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

LabPressureEquilibrium.defaultProps = {
  tempMult: 6, // max velocity avg * temp mult = new target temperature
  maxVelAvg: 120,
  handBumpConfig: {
    closedGrabStrength: 0.4,
    openGrabStrength: 0.7,
    handTwistTolerance: 0.7,
    minAmplitude: 5
  },
  addRmAtomConfig: {
    closedGrabStrength: 0.8,
    minAmplitude: 50, // mm
    maxTime: 2000     // ms
  }
};

reactMixin.onClass(LabPressureEquilibrium, leapStateHandling);
