import React from 'react';
import ReactDOM from 'react-dom';
import LeapHandsView from '../common/js/components/leap-hands-view.jsx';
import './hands-view.less'

ReactDOM.render(<LeapHandsView width='100%' height='100%' handsOpacity={1}/>, document.getElementById('app'));
