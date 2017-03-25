import React from 'react';
import LeapFrameRate from './leap-frame-rate.jsx';
import Dialog from './dialog.jsx';
import Plotter from './plotter.jsx';
import '../../css/leap-status.css';

export default class LeapStatus extends React.Component {
  get plotter() {
    return this.refs.plotter;
  }

  render() {
    const { children, visible } = this.props;
    return (
      <Dialog visible={visible} title='Settings'>
        <div className='status-box'>
          {visible ? <LeapFrameRate/> : ''}
          <Plotter ref='plotter' hidden={!visible}/>
          {visible && children}
        </div>
      </Dialog>
    )
  }
}
