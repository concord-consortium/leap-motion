import React from 'react';
import LeapHandsView from './hands-view.jsx';
import LeapStatus from './leap-status.jsx';
import '../../css/leap-standard-info.css';

export default class LeapStandardInfo extends React.Component {
  get plotter() {
    return this.refs.status.plotter;
  }

  render() {
    return (
      <div className='leap-standard-info'>
        <div className='state-and-plotter'>
          <div className='state-msg'>{this.props.stateMsg}</div>
          <LeapStatus visible={settingsVisible} ref='status'/>
        </div>
        <LeapHandsView width='299px' height='347px' handsOpacity={1}/>
      </div>
    )
  }
}
