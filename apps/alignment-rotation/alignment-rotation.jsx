import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import HandsView from '../common/js/components/hands-view.jsx';
import leapStateHandlingV2 from '../common/js/mixins/leap-state-handling-v2';
import LeapStatus from '../common/js/components/leap-status.jsx';
import HandMove from './hand-move';

const DEFAULT_CONFIG = {
  closedGrabStrength: 0.7,
  resetHandTimeout: 500,
  minTranslationMovement: 1.0,
  upYTolerance: 0.1
};

export default class AlignmentRotation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      snapshots: [],
      leapState: 'initial',
      previousFrame: null,
      pointerDirection: [0,0,0],
      handTranslation: [0,0,0],
      isPointing: false
    };
    this.handMove = new HandMove({}, this.gestureCallbacks);
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
    const {previousFrame, pointerDirection, isPointing} = this.state;
    if (frame.hands.length > 0){
      // calculate relative translation since previous frame
      if (previousFrame){
        this.handMove.handleLeapFrame(frame, previousFrame);
      }
      // calculate pointer angle, if a pointer is present
      let activePointers = frame.pointables.filter(function (pointer){
        // first finger, only if extended and valid
        return pointer.type==1 && pointer.extended && pointer.valid;
      });
      // in case user is using two hands
      let pointable = activePointers[0];
      if (pointable){
        this.setState({pointerDirection: pointable.direction, isPointing: true});
      } else {
        this.setState({isPointing: false});
      }
      this.setState({previousFrame: frame});
    }
  }

  setLeapState(v) {
    if (v !== this.state.leapState) this.setState({leapState: v});
  }

  get gestureCallbacks() {
    return {
      leapState: (data) => {
        if (data.closedHandType) {
          this.setLeapState('closedHand');
        } else {
          this.setLeapState(data.numberOfHands === 1 ? 'oneHandDetected' : 'initial');
        }
      },
      gestureDetected: (data) => {
        // largest movement translation in any one direction
        let translationDelta = Math.max.apply(null, data.translation.map(Math.abs));
        if (translationDelta > DEFAULT_CONFIG.minTranslationMovement){
          this.setState({handTranslation: data.translation});
        }
      }
    };
  }

  radiansToDegrees(rad){
    return rad * 180/Math.PI;
  }
  vectorToDegreeString(vectorArray){
    // for human-friendly rendering
    let degString = this.radiansToDegrees(vectorArray[0]).toFixed(2) + ", " + this.radiansToDegrees(vectorArray[1]).toFixed(2) + ", " + this.radiansToDegrees(vectorArray[2]).toFixed(2);
    let radString = vectorArray[0].toFixed(2) + ", " + vectorArray[1].toFixed(2) + ", " + vectorArray[2].toFixed(2);
    return degString;
  }
  vectorToRadString(vectorArray){
    // for human-friendly rendering
    let degString = this.radiansToDegrees(vectorArray[0]).toFixed(2) + ", " + this.radiansToDegrees(vectorArray[1]).toFixed(2) + ", " + this.radiansToDegrees(vectorArray[2]).toFixed(2);
    let radString = vectorArray[0].toFixed(2) + ", " + vectorArray[1].toFixed(2) + ", " + vectorArray[2].toFixed(2);
    return radString;
  }
  isFingerPointingUp(){
    const {pointerDirection, isPointing} = this.state;
    return pointerDirection[1] > DEFAULT_CONFIG.upYTolerance && isPointing;
  }


  render() {
    const { snapshots, pointerDirection, handTranslation } = this.state;
    const json = JSON.stringify(snapshots, null, 2);
    let dir = this.vectorToDegreeString(pointerDirection);
    let t = this.vectorToDegreeString(handTranslation);
    return (
      <div className='alignment-rotation'>
        <div className='view-container'>
          <HandsView ref='handsView' width='100%' height='500px' handsOpacity={1} phantomHands={this.getPhantomHands()}/>
        </div>
        <div className='controls'>
          <button onClick={this.snapshot}>Take snapshot</button>
          <button onClick={this.rmPhantomHand}>Remove last snapshot</button>
          <div>
            <textarea value={json} readOnly/>
            <LeapStatus ref='status'>
              <div>Direction: {dir}</div>
              {this.isFingerPointingUp() && <div>Up!</div>

              }
              <div>Translation: {t}</div>
            </LeapStatus>
          </div>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(AlignmentRotation, pureRender);
reactMixin.onClass(AlignmentRotation, leapStateHandlingV2);
