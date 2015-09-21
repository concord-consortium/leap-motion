import React from 'react';
import Leap from 'leapjs';
import 'leapjs-plugins';
import '../../css/leap-hands-view.css';

export default class LeapHandsView extends React.Component {
  componentDidMount() {
    Leap.loop(function (frame) {
      // To do it "reactive" way should use state, but we also use 'shouldComponentUpdate = false' so we
      // don't mess up ThreeJS scene. That's why we need to update FPS reading manually.
      React.findDOMNode(this.refs.fpsValue).textContent = frame.currentFrameRate.toFixed();
    }.bind(this)).use('boneHand', {
      targetEl: React.findDOMNode(this.refs.container),
      width: this.props.width,
      height: this.props.height
    });
  }
  
  shouldComponentUpdate() {
    // Don't modifiy container so we don't break ThreeJS scene!
    return false;
  }

  render() {
    return (
      <div className='hands-view' ref='container'>
        <div className='leap-fps'>Leap frame rate: <span ref='fpsValue'></span></div>
      </div>
    )
  }
}

LeapHandsView.defaultProps = {
  width: 299,
  height: 299
};
