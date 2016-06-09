import React from 'react';
import ReactDOM from 'react-dom';
import LeapHandsView from '../common/js/components/leap-hands-view-simple.jsx';
import './style.less'

const width = document.body.clientWidth;
const height = document.body.clientHeight;
ReactDOM.render(<LeapHandsView width={width} height={height}/>, document.getElementById('app'));
