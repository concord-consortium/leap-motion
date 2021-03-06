import React from 'react';
import leapController from '../tools/leap-controller';
import 'leapjs-plugins';

export default class LeapHandsView extends React.Component {
  componentDidMount() {
    leapController.use('boneHand', {
      targetEl: this.refs.container,
      width: this.props.width,
      height: this.props.height
    });
  }

  render() {
    return <div className='hands-view' ref='container'></div>;
  }
}

LeapHandsView.defaultProps = {
  width: 300,
  height: 300
};
