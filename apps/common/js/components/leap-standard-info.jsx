import React from 'react';
import LeapHandsView from './leap-hands-view.jsx';
import LeapFrameRate from './leap-frame-rate.jsx';
import Plotter from './plotter.jsx';

export default class LeapStandardInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      debugEnabled: true
    };
    this._handleDebugChange = this._handleDebugChange.bind(this);
  }

  get plotter() {
    return this.refs.plotter;
  }

  _handleDebugChange(event) {
    this.setState({debugEnabled: event.target.checked});
  }

  render() {
    return (
      <div className='leap-standard-info'>
        <div className='state-and-plotter'>
          <div className='state-msg'>{this.props.stateMsg}</div>
          <div className='status-box'>
            <label><input type='checkbox' checked={this.state.debugEnabled} onChange={this._handleDebugChange}/> Status</label>
            {this.state.debugEnabled ? <LeapFrameRate/> : ''}
            <Plotter ref='plotter' hidden={!this.state.debugEnabled}/>
          </div>
        </div>
        <LeapHandsView height='347'/>
      </div>
    )
  }
}
