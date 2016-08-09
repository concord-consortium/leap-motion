import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import LeapHandsView from '../common/js/components/leap-hands-view.jsx';
import {handSnapshot, addPhantomHand, followHand, removePhantomHand} from '../common/js/tools/leap-phantom-hand';
import './hands-view-realistic.less'

export default class HandsViewRealistic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      handSnapshot: ''
    };
    this.phantomHands = [];
    this.snapshot = this.snapshot.bind(this);
    this.rmPhantomHand = this.rmPhantomHand.bind(this);
  }

  snapshot() {
    handSnapshot(data => {
      this.setState({handSnapshot: JSON.stringify(data, null, 2)});
      const mesh = addPhantomHand(data);
      followHand(mesh, {type: data.type, xOffset: -100});
      this.phantomHands.push(mesh);
    });
  }

  rmPhantomHand() {
    const mesh = this.phantomHands.pop();
    if (mesh) {
      removePhantomHand(mesh);
      this.setState({handSnapshot: ''});
    }
  }

  render() {
    const { handSnapshot } = this.state;
    return (
      <div className='hands-view-realistic'>
        <div className='view-container'>
          <LeapHandsView width='100%' height='100%' handsOpacity={1}/>
        </div>
        <div className='controls'>
          <button onClick={this.snapshot}>Take snapshot</button>
          <button onClick={this.rmPhantomHand}>Remove last snapshot</button>
          <div>
            <textarea value={handSnapshot} readOnly/>
          </div>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(HandsViewRealistic, pureRender);
