import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import HandsView from '../common/js/components/hands-view.jsx';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import LeapStatus from '../common/js/components/leap-status.jsx';

export default class AlignmentRotation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      snapshots: [],
      leapState: 'initial',
      previousFrame: null,
      pointerDirection: [0,0,0],
      handTranslation: [0,0,0]
    };
    this.rmPhantomHand = this.rmPhantomHand.bind(this);
  }


  rmPhantomHand() {
    const { snapshots } = this.state;
    const newSnapshots = snapshots.slice(0, -1);
    this.setState({snapshots: newSnapshots});
  }

  getPhantomHands() {
    const { snapshots } = this.state;
    return {
      hands: snapshots.map(snapshot => {
        return {
          frames: [snapshot],
          follow: {xOffset: -100}
        };
      })
    };
  }

  handleLeapFrame(frame) {
    const {previousFrame, pointerDirection} = this.state;
    let pointable, direction, translation = null;
    let activePointers = frame.pointables.filter(function (pointer){
      // first finger, only if extended and valid
      return pointer.type==1 && pointer.extended && pointer.valid;
    });
    // in case user is using two hands
    pointable = activePointers[0];

    if (pointable){
      direction = pointable.direction;
      //console.log(direction);
      this.setState({pointerDirection: direction});
    }
    if (frame.hands.length > 0){

      if (previousFrame){
        translation = frame.hands[0].translation(previousFrame);
        this.setState({handTranslation: translation});
      }
      this.setState({previousFrame: frame});
    }
  }

  render() {
    const { snapshots, pointerDirection, handTranslation } = this.state;
    const json = JSON.stringify(snapshots, null, 2);
    return (
      <div className='alignment-rotation'>
        <div className='view-container'>
          <HandsView ref='handsView' width='100%' height='100%' handsOpacity={1} phantomHands={this.getPhantomHands()}/>
        </div>
        <div className='controls'>
          <button onClick={this.snapshot}>Take snapshot</button>
          <button onClick={this.rmPhantomHand}>Remove last snapshot</button>
          <div>
            <textarea value={json} readOnly/>
            <LeapStatus ref='status'>
              <div>Direction: {pointerDirection}</div>
              <div>Translation: {handTranslation}</div>
            </LeapStatus>
          </div>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(AlignmentRotation, pureRender);
reactMixin.onClass(AlignmentRotation, leapStateHandlingV2);
