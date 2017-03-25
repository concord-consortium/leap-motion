import React from 'react';
import Draggable from 'react-draggable';

import '../../css/dialog.less';

export default class Dialog extends React.PureComponent {
  render() {
    const { visible, title, children } = this.props;
    return (
      <Draggable zIndex={100} handle='.handle'>
        <div className={`dialog ${visible ? 'visible' : ''}`}>
          <div className='handle'>{title}</div>
          <div className='content'>
            {children || <p>Some text can go here!!</p>}
          </div>
        </div>
      </Draggable>
    );
  }
}

Dialog.defaultProps = {
  title: ''
};
