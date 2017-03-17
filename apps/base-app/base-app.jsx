import React from 'react';
import getURLParam from '../common/js/tools/get-url-param';
import HandsViewRealistic from '../hands-view-realistic/hands-view-realistic.jsx';
import LabHeatTransfer from '../lab-heat-transfer/lab-heat-transfer.jsx';
import LabVolumePressure from '../lab-volume-pressure/lab-volume-pressure.jsx';

import './base-app.less';


export default class BaseApp extends React.Component {
  render() {
    return (
      <div className='app' ref='container'>
        <div className='header'>
          <img className='projectlogo' src="logos/grasp.png" alt="GRASP project logo" />
          <img className="illogo" alt="Illinois Logo" src="http://publish.illinois.edu/graspprogram/files/2015/11/logo.gif" />
          <img className='cclogo' src="logos/cclogo.png" alt="Concord Consortium logo" />
        </div>
        <div className='simulation'>
          <h1>GRASP Simulations</h1>
          <LabVolumePressure />
        </div>
      </div>
    );
  }
}