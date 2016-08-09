import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import leapController from '../common/js/tools/leap-controller';
import {plungerHand} from './phantom-hands';
import {addPhantomHand, followHand, removePhantomHand} from '../common/js/tools/leap-phantom-hand';
import './interactive-tips.less';

export default class InteractiveTips extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      x: 0,
      y: 0
    };
  }

  componentDidMount() {
    leapController.on('frame', (frame) => {
      const convertHandPos = (hand) => {
        const handMesh = hand.data('riggedHand.mesh');
        const screenPosition = handMesh.screenPosition(hand.palmPosition);
        this.onHandPositionChange(hand, screenPosition);
      };
      const hands = frame.hands;
      let hand;
      if (hand = hands[0]) {
        convertHandPos(hand);
      }
      if (hand = hands[1]) {
        convertHandPos(hand);
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.rotation && this.props.rotation) {
      // Add phantom hand.
      this.phantomHand = addPhantomHand(plungerHand);
      followHand(this.phantomHand, {type: plungerHand.type, xOffset: -70});
      
    } else if (this.phantomHand && prevProps.rotation && !this.props.rotation) {
      // Rm phantom hand.
      removePhantomHand(this.phantomHand);
      this.phantomHand = null;
    }
  }

  onHandPositionChange(hand, position) {
    if (hand.type === 'left') {
      this.setState({x: position.x + 'px', y: position.y + 'px'});
    }
  }

  renderHandRotationTip() {
    const { x, y } = this.state;
    const transform = `translate3d(${x}, -${y}, 0)`;
    return (
      <div className='interactive-tips left-hand-rotation' style={{transform}}>
      </div>
    );
  }

  render() {
    const { rotation } = this.props;
    if (rotation) {
      return this.renderHandRotationTip();
    }
    return null;
  }
}

reactMixin.onClass(InteractiveTips, pureRender);
