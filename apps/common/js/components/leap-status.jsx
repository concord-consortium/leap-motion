import React from 'react';
import LeapFrameRate from './leap-frame-rate.jsx';
import Plotter from './plotter.jsx';
import '../../css/leap-status.css';

export default class LeapStatus extends React.Component {
  get plotter() {
    return this.refs.plotter;
  }

  render() {
    const { visible, children } = this.props;
    return (
      <div className='status-box'>
        {visible ? <LeapFrameRate/> : ''}
        <Plotter ref='plotter' hidden={!visible}/>
        {visible && children}
      </div>
    )
  }
}

LeapStatus.defaultProps = {
  visible: true
};
