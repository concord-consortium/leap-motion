import React from 'react';
import LeapHandsView from './leap-hands-view.jsx';
import '../../css/instructions-overlay.less';

export default class InstructionsOverlay extends React.Component {

  render() {
    const { visible, width, height, className, children } = this.props;

    return (
      <div className={`overlay ${className} ${visible ? '' : 'hidden'}`}>
        <LeapHandsView width={width} height={height}/>
        <div className='instructions'>
          {children}
        </div>
      </div>
    );
  }
}
