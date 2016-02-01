import React from 'react';
import reactMixin from 'react-mixin';
import leapStateHandling from '../common/js/mixins/leap-state-handling';
import avg from '../common/js/tools/avg';
import AddRmObj from '../common/js/gestures/add-rm-obj';
import LeapStandardInfo from '../common/js/components/leap-standard-info.jsx';

export default class LabAddRmAtomTest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      objCount: 100,
      objAdded: false,
      objRemoved: false,
      handType: null
    };
  }

  componentDidMount() {
    this.addRmObj = new AddRmObj(this.props.addRmAtomConfig, this.gestureDetected.bind(this), this.plotter);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  handleGestureConfigChange(event) {
    this.addRmObj.config[event.target.name] = event.target.value;
  }

  gestureDetected(data) {
    if (data.removed) {
      this.setState({objRemoved: true, objCount: this.state.objCount - 1, handType: data.handType});
      setTimeout(function () {
        this.setState({objRemoved: false});
      }.bind(this), 1500);
    } else if (data.added) {
      this.setState({objAdded: true, objCount: this.state.objCount + 1, handType: data.handType});
      setTimeout(function () {
        this.setState({objAdded: false});
      }.bind(this), 1500);
    }
  }

  nextLeapState(stateId, frame, data) {
    return this.addRmObj.nextLeapState(stateId, frame, data);
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
            <p>Close your hand, move it <b>up</b> and open to <b>remove</b> an atom.</p>
            <p>Close your hand, move it <b>down</b> and open to <b>add</b> an atom.</p>
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
          Closed hand grab strength [0, 1]: <input type='text' name='closedGrabStrength'
                                                   defaultValue={this.props.addRmAtomConfig.closedGrabStrength}
                                                   onChange={this.handleGestureConfigChange.bind(this)}/>
        </p>
      </div>
    )
  }
}

LabAddRmAtomTest.defaultProps = {
  addRmAtomConfig: {
    closedGrabStrength: 0.8,
    minAmplitude: 50, // mm
    maxTime: 2000     // ms
  }
};

reactMixin.onClass(LabAddRmAtomTest, leapStateHandling);
