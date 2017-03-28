import React from 'react';
import Draggable from 'react-draggable';

import '../../css/dialog.less';

export default class Dialog extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isDragging: false
    };
    this.handleStart = this.handleStart.bind(this);
    this.handleStop = this.handleStop.bind(this);
  }

  handleStart() {
    this.setState({isDragging: true});
  }

  handleStop() {
    this.setState({isDragging: false});
  }

  render() {
    const { isDragging } = this.state;
    const { visible, title, children } = this.props;
    // When user is dragging the dialog, render additional overlay to cover all the iframes and ensure
    // that dragging won't break when pointer is over them.
    return (
      <div>
        {isDragging && <div className='dialog-dragging-overlay' />}
        <Draggable zIndex={100} handle='.handle' onStart={this.handleStart} onStop={this.handleStop}>
          <div className={`dialog ${visible ? 'visible' : ''}`}>
            <div className='handle'>{title}</div>
            <div className='content'>
              {children || <p>Some text can go here.</p>}
            </div>
          </div>
        </Draggable>
      </div>
    );
  }
}

Dialog.defaultProps = {
  title: ''
};
