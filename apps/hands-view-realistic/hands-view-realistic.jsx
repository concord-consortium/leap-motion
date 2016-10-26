import React from 'react';
import reactMixin from 'react-mixin';
import pureRender from 'react-addons-pure-render-mixin';
import HandsView from '../common/js/components/hands-view.jsx';

import './hands-view-realistic.less'

export default class HandsViewRealistic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      snapshots: []
    };
    this.snapshot = this.snapshot.bind(this);
    this.rmPhantomHand = this.rmPhantomHand.bind(this);
  }

  snapshot() {
    this.refs.handsView.snapshotHand(data => {
      const { snapshots } = this.state;
      const newSnapshots = snapshots.concat(data);
      this.setState({snapshots: newSnapshots});
    });
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

  render() {
    const { snapshots } = this.state;
    const json = JSON.stringify(snapshots, null, 2);
    return (
      <div className='hands-view-realistic'>
        <div className='view-container'>
          <HandsView ref='handsView' width='100%' height='100%' handsOpacity={1} phantomHands={this.getPhantomHands()}/>
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
