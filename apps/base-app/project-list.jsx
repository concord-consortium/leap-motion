import React from 'react';
import LanguageSelector from '../common/js/components/language-selector.jsx';
import getURLParam from '../common/js/tools/get-url-param';

export default class ProjectList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { language: getURLParam('lang') || 'en_us' }
    this.handleSelectLanguage = this.handleSelectLanguage.bind(this);
  }

  handleSelectLanguage(lang){
    const { language } = this.state;
    if (lang !== language){
      this.setState({language: lang});
    }
  }

  render() {
    const {language} = this.state;

    return (
      <div className='projects'>
        <div className='project-language-selector'>
          <LanguageSelector lang={language} onLanguageChange={this.handleSelectLanguage} />
        </div>
        <h2>The most recent apps with gesture input:</h2>
        <ul>
          <li>Gas Model: <a href="?simulation=labvolumepressure" target="_blank">lab-volume-pressure</a></li>
          <li>Heat Transfer: <a href="?simulation=labheattransfer" target="_blank">lab-heat-transfer</a></li>
          <li>Heat Transfer (transparent): <a href="?simulation=labheattransfertransparent" target="_blank">lab-heat-transfer-transparent</a></li>
          <li>Heat Transfer (two hands): <a href="?simulation=labheattransfertwohands" target="_blank">lab-heat-transfer-two-hands</a></li>
          <li>Heat Transfer (two hands, RealSense): <a href="?simulation=labheattransfertwohands&device=realsense" target="_blank">lab-heat-transfer-two-hands</a></li>
          <li>Heat Transfer (micro): <a href="?simulation=labheattransfermicro" target="_blank">lab-heat-transfer-micro</a></li>
          <li>Heat Transfer (micro, direct control): <a href="?simulation=labheattransfermicrodirect" target="_blank">lab-heat-transfer-micro-direct</a></li>
          <li>Heat Transfer (micro, direct control, two atoms): <a href="?simulation=labheattransfermicrotwoatoms" target="_blank">lab-heat-transfer-micro-two-atoms</a></li>
          <li>Heat Transfer (micro, long): <a href="?simulation=labheattransferlong" target="_blank">lab-heat-transfer-long</a></li>
          <li>Seasons: <a href="?simulation=seasons" target="_blank">seasons-sunray-angle</a></li>
          <li>Seasons (narrow): <a href="?simulation=seasonsnarrow" target="_blank">seasons-narrow</a></li>
        </ul>
        <h2>Lab models (without gesture input):</h2>
        <ul>
          <li><a href="http://lab.concord.org/interactives.html#interactives/grasp/heat-transfer-micro-v1.json" target="_blank">Heat Transfer Micro V1</a></li>
          <li><a href="http://lab.concord.org/interactives.html#interactives/grasp/heat-transfer-micro-v2.json" target="_blank">Heat Transfer Micro V2</a></li>
          <li><a href="http://lab.concord.org/interactives.html#interactives/grasp/heat-transfer-micro-v3.json" target="_blank">Heat Transfer Micro V3</a></li>
          <li><a href="http://lab.concord.org/interactives.html#interactives/grasp/heat-transfer-micro-v4.json" target="_blank">Heat Transfer Micro V4</a></li>
        </ul>
        <h2>Old apps:</h2>
        <ul>
          <li>Pressure Equilibrium Model: <a href="?simulation=labpressureequilibrium" target="_blank">lab-pressure-equilibrium</a></li>
        </ul>
        <h2>Tests:</h2>
        <ul>
          <li><a href="?simulation=handsviewrealistic&device=leap" target="_blank">hands-view-realistic (Leap)</a></li>
          <li><a href="?simulation=handsviewrealistic&device=realsense" target="_blank">hands-view-realistic (RealSense)</a></li>
          <li><a href="?simulation=realsensetest" target="_blank">realsense-test</a></li>
          <li><a href="?simulation=labaddrmatomtest" target="_blank">lab-add-rm-atom-test</a></li>
          <li><a href="?simulation=labaddrmatomtestswipe" target="_blank">lab-add-rm-atom-swipe</a></li>
          <li><a href="?simulation=labtemperatureabsolute" target="_blank">lab-temperature-absolute</a></li>
          <li><a href="?simulation=labtemperaturedelta" target="_blank">lab-temperature-delta</a></li>
          <li><a href="?simulation=rotation" target="_blank">alignment-rotation</a></li>
        </ul>
        <h2>Old versions:</h2>
        <ul>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.6.0/index.html" target="_blank">0.6.0 (Jun 13, 2017)</a></li>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.5.0/index.html" target="_blank">0.5.0 (Mar 20, 2017)</a></li>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.4.0/index.html" target="_blank">0.4.0 (Jun 9, 2016)</a></li>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.3.0/index.html" target="_blank">0.3.0 (Feb 18, 2016)</a></li>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.2.2/index.html" target="_blank">0.2.2 (Feb 17, 2016)</a></li>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.2.0/index.html" target="_blank">0.2.0 (Feb 13, 2016)</a></li>
          <li><a href="http://models-resources.concord.org/leap-motion/version/0.1.0/index.html" target="_blank">0.1.0 (Feb 2, 2016)</a></li>
        </ul>
      </div>
    );
  }
}
