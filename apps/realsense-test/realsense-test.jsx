import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import realsenseController from '../common/js/realsense/controller';
import { realSenseFrame2Leap } from '../common/js/realsense/realsense-2-leap';
import HandsView from '../common/js/components/hands-view.jsx';

import './realsense-test.less';

function lmPosFormat(obj, prop) {
  if (!obj) return null;
  const pos = obj[prop];
  return (
    <tr><td className="prop-name">{prop}</td><td>{pos[0].toFixed(1)}</td><td>{pos[1].toFixed(1)}</td><td>{pos[2].toFixed(1)}</td></tr>
  );
}

export default class RealSenseTest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false
    };
  }

  componentDidMount() {
    realsenseController.init();
    realsenseController.on('frame', frame => {
      const lmFrame = realSenseFrame2Leap(frame);
      if (lmFrame.hands.length > 0) {
        const lmHand = lmFrame.hands[0];
        this.setState({
          lmHand
        });
      }
    });
    realsenseController.on('connect', connected => {
      this.setState({connected});
    })
  }

  renderFinger(lmHand, idx) {
    return (
      <tbody>
        <tr><td className="header">Finger {idx}</td></tr>
        {lmPosFormat(lmHand.fingers[idx], 'tipPosition')}
        {lmPosFormat(lmHand.fingers[idx], 'dipPosition')}
        {lmPosFormat(lmHand.fingers[idx], 'pipPosition')}
        {lmPosFormat(lmHand.fingers[idx], 'mcpPosition')}
      </tbody>
    );
  }

  render() {
    const { lmHand, connected } = this.state;
    return (
      <div className="realsense-test">
        <div className="inline">
          <div className="header">RealSense connected: {connected ? "true" : "false"}</div>
          <div className="header">Data converted to Leap format</div>
          {lmHand &&
            <table>
              <tbody>
                {lmPosFormat(lmHand, 'palmPosition')}
                {lmPosFormat(lmHand, 'palmNormal')}
                {lmPosFormat(lmHand, 'direction')}
              </tbody>
              {this.renderFinger(lmHand, 0)}
              {this.renderFinger(lmHand, 1)}
              {this.renderFinger(lmHand, 2)}
              {this.renderFinger(lmHand, 3)}
              {this.renderFinger(lmHand, 4)}
            </table>
          }
        </div>
        <div className="inline">
          <HandsView device='realsense' width='700px' height='700px' handsOpacity={1}/>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(RealSenseTest, pureRender);
