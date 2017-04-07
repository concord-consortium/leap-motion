import React from 'react';
import Typekit from 'react-typekit';
import getURLParam from '../common/js/tools/get-url-param';

import HandsViewRealistic from '../hands-view-realistic/hands-view-realistic.jsx';
import LabAddRmAtomTest from '../lab-add-rm-atom-test/lab-add-rm-atom-test.jsx';
import LabAddRmAtomTestSwipe from '../lab-add-rm-atom-test-swipe/lab-add-rm-atom-test-swipe.jsx';

import LabHeatTransfer from '../lab-heat-transfer/lab-heat-transfer.jsx';
import LabHeatTransferTransparent from '../lab-heat-transfer-transparent/lab-heat-transfer-transparent.jsx';
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
import AlignmentRotation from '../alignment-rotation/alignment-rotation.jsx';
import SeasonsSunrayAngle from '../seasons-sunray-angle/seasons-sunray-angle.jsx';
import ProjectList from './project-list.jsx';

import './base-app.less';
import '../common/css/basic-layout.css';

const SIM_LIST = {
  'index': ProjectList,

  'handsviewrealistic': HandsViewRealistic,
  'labaddrmatomtest': LabAddRmAtomTest,
  'labaddrmatomtestswipe': LabAddRmAtomTestSwipe,

  'labheattransfer': LabHeatTransfer,
  'labheattransfertransparent': LabHeatTransferTransparent,
  'labheattransferlong': LabHeatTransferLong,
  'labheattransfermicro': LabHeatTransferMicro,
  'labheattransfermicrodirect': LabHeatTransferMicroDirect,
  'labheattransfermicrotwoatoms': LabHeatTransferMicroTwoAtoms,
  'labheattransfertwohands': LabHeatTransferTwoHands,

  'labpressureequilibrium': LabPressureEquilibrium,
  'labtemperatureabsolute': LabTemperatureAbsolute,
  'labtemperaturedelta': LabTemperatureDelta,
  'labtemperaturetest': LabTemperatureTest,
  'rotation': AlignmentRotation,

  'labvolumepressure': LabVolumePressure,
  'realsensetest': RealSenseTest,
  'seasons': SeasonsSunrayAngle,
  'seasonsnarrow': SeasonsSunrayAngle
};

const DEF_SIMULATION = getURLParam('simulation') || 'index';

export default class BaseApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aboutVisible: false,
      settingsVisible: false
    };
    this.toggleAbout = this.toggleAbout.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
  }

  toggleAbout() {
    const { aboutVisible } = this.state;
    this.setState({
      aboutVisible: !aboutVisible
    });
  }

  toggleSettings() {
    const { settingsVisible } = this.state;
    this.setState({
      settingsVisible: !settingsVisible
    });
  }

  render() {
    const { sim } = this.props;
    const { aboutVisible, settingsVisible } = this.state;
    const simulation = React.createElement(SIM_LIST[sim], {
      aboutVisible,
      settingsVisible,
      toggleAbout: this.toggleAbout,
      toggleSettings: this.toggleSettings
    });
    let componentStyleList = ['simulation', sim];
    let componentStyles = componentStyleList.join(' ');

    return (
      <div className='main' ref='container'>
        <Typekit kitId="hdw8ayt" />
        <div className='header'>
          <div className='header-inner'>
            <img className='projectlogo' src="logos/grasp.png" alt="GRASP Project" />
            <a href="http://illinois.edu/" title="University of Illinois at Urbana-Champaign"><img className="illogo" alt="University of Illinois at Urbana-Champaign" src="http://publish.illinois.edu/graspprogram/files/2015/11/logo.gif" /></a>
            <a href="https://concord.org/" title="The Concord Consortium - Revolutionary digital learning for science, math, and engineering"><img className='cclogo' src="logos/cclogo.png" alt="Concord Consortium" /></a>
          </div>
        </div>
        <div className={componentStyles}>
          <h1>GRASP Simulations</h1>
          {simulation}
        </div>
      </div>
    );
  }
}

BaseApp.defaultProps = {
  sim: DEF_SIMULATION
};
