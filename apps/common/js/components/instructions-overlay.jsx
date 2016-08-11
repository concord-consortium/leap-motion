import React from 'react';
import LeapHandsView from './leap-hands-view.jsx';
import '../../css/instructions-overlay.less';

export default class InstructionsOverlay extends React.Component {
  componentWillMount() {
    this.setState({ handsOpacity: this.props.handsOpacity });
  }
  componentWillReceiveProps(newProps) {
    if (newProps.handsOpacity != this.props.handsOpacity) {
      this.setState({ handsOpacity: newProps.handsOpacity });
    }
  }
  render() {
    const { visible, className, children, } = this.props;
    const { handsOpacity = 0.85} = this.state;

    return (
      <div className={`overlay ${className} ${visible ? '' : 'hidden'}`}>
        <LeapHandsView handsOpacity={handsOpacity}/>
        <div className='instructions'>
          {children}
        </div>
      </div>
    );
  }
}
