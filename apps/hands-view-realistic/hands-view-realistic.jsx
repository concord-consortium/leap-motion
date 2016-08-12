import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import LeapHandsView from '../common/js/components/leap-hands-view.jsx';
import {snapshotHand, addPhantomHand, followRealHand, removePhantomHand} from '../common/js/tools/leap-phantom-hand';
import './hands-view-realistic.less'

export default class HandsViewRealistic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      snapshots: []
    };
    this.phantomHands = [];
    this.snapshot = this.snapshot.bind(this);
    this.rmPhantomHand = this.rmPhantomHand.bind(this);
  }

  snapshot() {
    snapshotHand(data => {
      const { snapshots } = this.state;
      const newSnapshots = snapshots.concat(data);
      this.setState({snapshots: newSnapshots});
      const mesh = addPhantomHand(data);
      followRealHand(mesh, {type: data.type, xOffset: -100});
      this.phantomHands.push(mesh);
    });
  }

  rmPhantomHand() {
    const mesh = this.phantomHands.pop();
    if (mesh) {
      removePhantomHand(mesh);
      const { snapshots } = this.state;
      const newSnapshots = snapshots.slice(0, -1);
      this.setState({snapshots: newSnapshots});
    }
  }

  render() {
    const { snapshots } = this.state;
    const json = JSON.stringify(snapshots, null, 2);
    return (
      <div className='hands-view-realistic'>
        <div className='view-container'>
          <LeapHandsView width='100%' height='100%' handsOpacity={1}/>
        </div>
        <div className='controls'>
          <button onClick={this.snapshot}>Take snapshot</button>
          <button onClick={this.rmPhantomHand}>Remove last snapshot</button>
          <div>
            <textarea value={json} readOnly/>
          </div>
        </div>
      </div>
    );
  }
}

reactMixin.onClass(HandsViewRealistic, pureRender);
