import React from 'react';
import Leap from 'leapjs';
import leapFps from '../tools/leap-fps';
import 'leapjs-plugins';
import '../../css/leap-hands-view.css';

export default class LeapHandsView extends React.Component {
  componentDidMount() {
    let fpsValue = React.findDOMNode(this.refs.fpsValue);
    let leapFpsValue = React.findDOMNode(this.refs.leapFpsValue);
    Leap.loop(function (frame) {
      // To do it "reactive" way should use state, but we also use 'shouldComponentUpdate = false' so we
      // don't mess up ThreeJS scene. That's why we need to update FPS readings manually.
      fpsValue.textContent = leapFps().toFixed();
      leapFpsValue.textContent = frame.currentFrameRate.toFixed();
    }.bind(this)).use('boneHand', {
      targetEl: React.findDOMNode(this.refs.container),
      width: this.props.width,
      height: this.props.height
    });
  }

  shouldComponentUpdate() {
    // Don't modify container so we don't break ThreeJS scene!
    return false;
  }

  render() {
    return (
      <div className='hands-view' ref='container'>
        <div className='leap-fps'>
          <div>Frame rate: <span ref='fpsValue'></span> (<span ref='leapFpsValue'></span>)</div>
        </div>
      </div>
    )
  }
}

LeapHandsView.defaultProps = {
  width: 299,
  height: 299
};
