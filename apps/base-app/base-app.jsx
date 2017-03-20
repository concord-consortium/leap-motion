import React from 'react';
import getURLParam from '../common/js/tools/get-url-param';
import HandsViewRealistic from '../hands-view-realistic/hands-view-realistic.jsx';
import LabHeatTransfer from '../lab-heat-transfer/lab-heat-transfer.jsx';
import LabVolumePressure from '../lab-volume-pressure/lab-volume-pressure.jsx';
import ProjectList from './project-list.jsx';

import './base-app.less';

const SIMULATION = getURLParam('simulation') || 'index';

export default class BaseApp extends React.Component {

  render() {
    const { sim, simList } = this.props;
    let renderSim = simList[sim];

    return (
      <div className='app' ref='container'>
        <div className='header'>
          <img className='projectlogo' src="logos/grasp.png" alt="GRASP project logo" />
          <img className="illogo" alt="Illinois Logo" src="http://publish.illinois.edu/graspprogram/files/2015/11/logo.gif" />
          <img className='cclogo' src="logos/cclogo.png" alt="Concord Consortium logo" />
        </div>
        <div className='simulation'>
          <h1>GRASP Simulations</h1>
          {renderSim}
        </div>
      </div>
    );
  }
}

BaseApp.defaultProps = {
  sim: SIMULATION,
  simList: {
    'index': <ProjectList/>,
    'labheattransfer': <LabHeatTransfer/>
  }
}