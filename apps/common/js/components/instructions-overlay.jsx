import React from 'react';
import LeapHandsView from './hands-view.jsx';
import '../../css/instructions-overlay.less';

export default class InstructionsOverlay extends React.Component {
  render() {
    const { visible, width, height, className, children, handsViewProps } = this.props;
    return (
      <div className={`overlay ${className} ${visible ? '' : 'hidden'}`}>
        <LeapHandsView width={width} height={height} {...handsViewProps}/>
        {children}
      </div>
    );
  }
}

InstructionsOverlay.defaultProps = {
  visible: true
};
