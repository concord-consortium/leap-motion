import React from 'react';
import LeapHandsView from './leap-hands-view.jsx';
import '../../css/instructions-overlay.less';

export default class InstructionsOverlay extends React.Component {
  render() {
    const { visible, width, height, className, children, handsOpacity } = this.props;
    return (
      <div className={`overlay ${className} ${visible ? '' : 'hidden'}`}>
        <LeapHandsView width={width} height={height} handsOpacity={handsOpacity}/>
        {children}
      </div>
    );
  }
}

InstructionsOverlay.defaultProps = {
  visible: true,
  handsOpacity: 0.85
};
