import React from 'react';
import LeapFrameRate from './leap-frame-rate.jsx';
import Plotter from './plotter.jsx';
import '../../css/leap-status.css';

export default class LeapStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: true
    };
    this._handleDebugChange = this._handleDebugChange.bind(this);
  }

  get plotter() {
    return this.refs.plotter;
  }

  _handleDebugChange(event) {
    this.setState({visible: event.target.checked});
  }

  render() {
    const { children } = this.props;
    const { visible } = this.state;
    return (
      <div className='status-box'>
        <label><input type='checkbox' checked={visible} onChange={this._handleDebugChange}/> Status</label>
        {this.state.visible ? <LeapFrameRate/> : ''}
        <Plotter ref='plotter' hidden={!visible}/>
        {visible && children}
      </div>
    )
  }
}
