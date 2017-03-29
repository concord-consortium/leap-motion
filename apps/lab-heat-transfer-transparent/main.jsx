import React from 'react';
import ReactDOM from 'react-dom';
import LabHeatTransfer from './../lab-heat-transfer/lab-heat-transfer.jsx';
import interactive from './lab-interactive.json';
import model from './lab-model.json';

import '../common/css/basic-layout.css';

ReactDOM.render(<LabHeatTransfer interactive={interactive} model={model}/>, document.getElementById('app'));
