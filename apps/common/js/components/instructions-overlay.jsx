import React from 'react';
import LeapHandsView from './leap-hands-view.jsx';
import '../../css/instructions-overlay.less';

export default class InstructionsOverlay extends React.Component {
  componentWillMount() {
    this.setState({ width: this.props.width, height: this.props.height, handsOpacity: this.props.handsOpacity });
  }
  componentWillReceiveProps(newProps) {
    if (newProps.width != this.props.width) {
      this.setState({ width: newProps.width, height: newProps.height, handsOpacity: newProps.handsOpacity });
    }
  }
  render() {
    const { visible, className, children, } = this.props;
    const { width, height, handsOpacity = 0.85} = this.state;

    return (
      <div className={`overlay ${className} ${visible ? '' : 'hidden'}`}>
        <LeapHandsView width={width} height={height} handsOpacity={handsOpacity}/>
        <div className='instructions'>
          {children}
        </div>
      </div>
    );
  }
}
