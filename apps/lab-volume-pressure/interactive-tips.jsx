import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import leapController from '../common/js/tools/leap-controller';
import {plungerHand, fist, tappingHand} from './phantom-hands';
import {addPhantomHand, followHand, setupHand, removePhantomHand} from '../common/js/tools/leap-phantom-hand';
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
    const oldHint = prevProps.hint;
    const newHint = this.props.hint;
    if (oldHint !== newHint) {
      this.cleanupPhantomHand();
      switch(newHint) {
        case 'rotate': return this.renderPlungerHand();
        case 'fist': return this.renderFistHand();
        case 'tap': return this.renderTappingHand();
      }
    }
  }

  cleanupPhantomHand() {
    if (this.phantomHand) {
      removePhantomHand(this.phantomHand);
      this.phantomHand = null;
    }
    if (this.animInterval) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
  }

  renderPlungerHand() {
    this.phantomHand = addPhantomHand(plungerHand[0]);
    followHand(this.phantomHand, {type: plungerHand[0].type, xOffset: -70});
    this.frameId = 0;
    this.animInterval = setInterval(() => {
      setupHand(this.phantomHand, plungerHand[this.frameId % plungerHand.length]);
      this.frameId += 1;
    }, 200);
  }

  renderFistHand() {
    this.phantomHand = addPhantomHand(fist[0]);
    followHand(this.phantomHand, {type: fist[0].type, xOffset: 100});
    this.frameId = 0;
    this.animInterval = setInterval(() => {
      setupHand(this.phantomHand, fist[this.frameId % fist.length]);
      this.frameId += 1;
    }, 250);
  }

  renderTappingHand() {
    this.phantomHand = addPhantomHand(tappingHand[0]);
    followHand(this.phantomHand, {type: tappingHand[0].type, xOffset: 0});
    this.frameId = 0;
    this.animInterval = setInterval(() => {
      const steps = 12;
      let mult = this.frameId % steps;
      if (mult > steps * 0.5) mult = steps - mult;
      followHand(this.phantomHand, {type: tappingHand[0].type, xOffset: (mult / steps) * -300});
      this.frameId += 1;
    }, 120);
  }

  onHandPositionChange(hand, position) {
    if (hand.type === 'left') {
      this.setState({x: position.x + 'px', y: position.y + 'px'});
    }
  }

  renderHandRotationArrow() {
    const { x, y } = this.state;
    const transform = `translate3d(${x}, -${y}, 0)`;
    return (
      <div className='interactive-tips left-hand-rotation' style={{transform}}>
      </div>
    );
  }

  render() {
    const { hint } = this.props;
    switch(hint) {
      case 'rotate': return this.renderHandRotationArrow();
      default: return null;
    }
  }
}

reactMixin.onClass(InteractiveTips, pureRender);
