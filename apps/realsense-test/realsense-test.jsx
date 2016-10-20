import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import realsenseController from '../common/js/realsense/controller';
realsenseController.init();
import leapController from '../common/js/tools/leap-controller';
import realSense2Leap from '../common/js/realsense/realsense-2-leap';

import './realsense-test.less';

function rsPosFormat(pos) {
  return `${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}`;
}

function lmPosFormat(pos) {
  return `${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}`;
}

export default class RealSenseTest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rsPosition: {x: 0, y: 0, z: 0},
      rsLmPosition: [0, 0, 0],
      lmPosition: [0, 0, 0]
    };
  }

  componentDidMount() {
    leapController.on('frame', frame => {
      if (frame.hands.length > 0) {
        const hand = frame.hands[0];
        this.setState({
          lmPosition: hand.palmPosition
        });
      }
    });

    realsenseController.on('frame', frame => {
      if (frame.numberOfHands > 0) {
        const hand = frame.hands[0];
        this.setState({
          rsPosition: hand.massCenterWorld
        });

        // Convert to Leap format.
        const lmFrame = realSense2Leap(frame);
        const lmHand = lmFrame.hands[0];
        this.setState({
          rsLmPosition: lmHand.palmPosition
        });
      }
    });
  }

  render() {
    const s = this.state;
    return (
      <div className='realsense-test'>
        RealSense (raw)
        <table>
          <tbody>
          <tr><td>Position [m]:</td><td>{rsPosFormat(s.rsPosition)}</td></tr>
          </tbody>
        </table>
        RealSense (convert to Leap)
        <table>
          <tbody>
          <tr><td>Position [mm]:</td><td>{lmPosFormat(s.rsLmPosition)}</td></tr>
          </tbody>
        </table>

        LeapMotion
        <table>
          <tbody>
          <tr><td>Position [mm]:</td><td>{lmPosFormat(s.lmPosition)}</td></tr>
          </tbody>
        </table>
      </div>
    );
  }
}

reactMixin.onClass(RealSenseTest, pureRender);
