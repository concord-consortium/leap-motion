import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../mixins/leap-state-handling';
import LabAddRmAtomTest from './lab-add-rm-atom-test.jsx';
import LeapStandardInfo from './leap-standard-info.jsx';
import AddRmObjSwipe from '../gestures/add-rm-obj-swipe';

export default class LabAddRmAtomTestSwipe extends LabAddRmAtomTest {
  componentDidMount() {
    this.addRmObj = new AddRmObjSwipe(this.props.addRmAtomConfig, this.gestureDetected.bind(this), this.plotter);
    this.leapConnect(); // we need to call it manually, as we overwrite method modified by react mixin
  }

  getStateMsg() {
    if (this.state.objRemoved) {
      return (
        <span style={{color: 'red'}}>Atom has been removed by { this.state.handType } hand!</span>
      );
    } else if (this.state.objAdded) {
      return (
        <span style={{color: 'green'}}>Atom has been added by { this.state.handType } hand!</span>
      );
    }
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hand (left or right) steady above the Leap device.';
      case 'oneHandDetected':
        return (
          <div>
            <p>Sweep <b>in</b> to <b>add</b> an atom.</p>
            <p>Sweep <b>out</b> to <b>remove</b> an atom.</p>
          </div>
        );
    }
  }

  render() {
    return (
      <div>
        <h2>Number of atoms: { this.state.objCount }</h2>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
        <p>
          Sweep max time [ms]: <input type='text' name='maxTime'
                                             defaultValue={this.props.addRmAtomConfig.maxTime}
                                             onChange={this.handleGestureConfigChange.bind(this)}/>
        </p>
        <p>
          Sweep min amplitude: <input type='text' name='minAmplitude'
                                      defaultValue={this.props.addRmAtomConfig.minAmplitude}
                                      onChange={this.handleGestureConfigChange.bind(this)}/>
        </p>
      </div>
    )
  }
}

LabAddRmAtomTest.defaultProps = {
  addRmAtomConfig: {
    bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
    minAmplitude: 1,
    maxTime: 110 // ms
  }
};