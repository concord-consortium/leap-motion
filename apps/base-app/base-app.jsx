import React from 'react';
import Typekit from 'react-typekit';
import getURLParam from '../common/js/tools/get-url-param';

import HandsViewRealistic from '../hands-view-realistic/hands-view-realistic.jsx';
import HandsViewSimple from '../common/js/components/leap-hands-view-simple.jsx';
import LabAddRmAtomTest from '../lab-add-rm-atom-test/lab-add-rm-atom-test.jsx';
import LabAddRmAtomTestSwipe from '../lab-add-rm-atom-test-swipe/lab-add-rm-atom-test-swipe.jsx';

import LabHeatTransfer from '../lab-heat-transfer/lab-heat-transfer.jsx';
import LabHeatTransferLong from '../lab-heat-transfer-long/lab-heat-transfer-long.jsx';
import LabHeatTransferMicro from '../lab-heat-transfer-micro/lab-heat-transfer-micro.jsx';
import LabHeatTransferMicroDirect from '../lab-heat-transfer-micro-direct/lab-heat-transfer-micro-direct.jsx';
import LabHeatTransferMicroTwoAtoms from '../lab-heat-transfer-micro-two-atoms/lab-heat-transfer-micro-two-atoms.jsx';
import LabHeatTransferTwoHands from '../lab-heat-transfer-two-hands/lab-heat-transfer-two-hands.jsx';

import LabPressureEquilibrium from '../lab-pressure-equilibrium/lab-pressure-equilibrium.jsx';
import LabTemperatureAbsolute from '../lab-temperature-absolute/lab-temperature-absolute.jsx';
import LabTemperatureDelta from '../lab-temperature-delta/lab-temperature-delta.jsx';
import LabTemperatureTest from '../lab-temperature-test/lab-temperature-test.jsx';

import LabVolumePressure from '../lab-volume-pressure/lab-volume-pressure.jsx';
import RealSenseTest from '../realsense-test/realsense-test.jsx';
import SeasonsSunrayAngle from '../seasons-sunray-angle/seasons-sunray-angle.jsx';
import ProjectList from './project-list.jsx';

import './base-app.less';
import '../common/css/basic-layout.css';


const SIMULATION = getURLParam('simulation') || 'index';
const width = document.body.clientWidth;
const height = document.body.clientHeight;

export default class BaseApp extends React.Component {

  render() {
    const { sim, simList } = this.props;
    let renderSim = simList[sim];
    let componentStyleList = ['simulation', sim];
    let componentStyles = componentStyleList.join(' ');

    return (
      <div className='main' ref='container'>
        <Typekit kitId="hdw8ayt" />
        <div className='header'>
          <img className='projectlogo' src="logos/grasp.png" alt="GRASP project logo" />
          <img className="illogo" alt="Illinois Logo" src="http://publish.illinois.edu/graspprogram/files/2015/11/logo.gif" />
          <img className='cclogo' src="logos/cclogo.png" alt="Concord Consortium logo" />
        </div>
        <div className={componentStyles}>
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
    'index': <ProjectList />,

    'handsviewrealistic': <HandsViewRealistic />,
    'handsviewsimple': <HandsViewSimple />,
    'labaddrmatomtest': <LabAddRmAtomTest />,
    'labaddrmatomtestswipe': <LabAddRmAtomTestSwipe />,

    'labheattransfer': <LabHeatTransfer />,
    'labheattransferlong': <LabHeatTransferLong />,
    'labheattransfermicro': <LabHeatTransferMicro />,
    'labheattransfermicrodirect': <LabHeatTransferMicroDirect />,
    'labheattransfermicrotwoatoms': <LabHeatTransferMicroTwoAtoms />,
    'labheattransfertwohands': <LabHeatTransferTwoHands />,

    'labpressureequilibrium': <LabPressureEquilibrium />,
    'labtemperatureabsolute': <LabTemperatureAbsolute />,
    'labtemperaturedelta': <LabTemperatureDelta />,
    'labtemperaturetest': <LabTemperatureTest />,

    'labvolumepressure': <LabVolumePressure />,
    'realsensetest': <RealSenseTest />,
    'seasons': <SeasonsSunrayAngle />
  },
  width: width,
  height: height
}