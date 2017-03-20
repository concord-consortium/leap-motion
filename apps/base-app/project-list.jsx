import React from 'react';

export default class ProjectList extends React.Component {

  render() {
    return (
      <div className='projects'>
        <h2>The most recent apps with gesture input:</h2>
        <ul>
          <li>Gas Model: <a href="lab-volume-pressure.html" target="_blank">lab-volume-pressure</a></li>
          <li>Heat Transfer: <a href="lab-heat-transfer.html" target="_blank">lab-heat-transfer</a></li>
          <li>Heat Transfer (two hands): <a href="lab-heat-transfer-two-hands.html" target="_blank">lab-heat-transfer-two-hands</a></li>
          <li>Heat Transfer (two hands, RealSense): <a href="lab-heat-transfer-two-hands.html?device=realsense" target="_blank">lab-heat-transfer-two-hands</a></li>
          <li>Heat Transfer (micro): <a href="lab-heat-transfer-micro.html" target="_blank">lab-heat-transfer-micro</a></li>
          <li>Heat Transfer (micro, direct control): <a href="lab-heat-transfer-micro-direct.html" target="_blank">lab-heat-transfer-micro-direct</a></li>
          <li>Heat Transfer (micro, direct control, two atoms): <a href="lab-heat-transfer-micro-two-atoms.html" target="_blank">lab-heat-transfer-micro-two-atoms</a></li>
          <li>Heat Transfer (micro, long): <a href="lab-heat-transfer-long.html" target="_blank">lab-heat-transfer-long</a></li>
          <li>Seasons: <a href="seasons-sunray-angle.html" target="_blank">seasons-sunray-angle</a></li>
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
          <li>Pressure Equilibrium Model: <a href="lab-pressure-equilibrium.html" target="_blank">lab-pressure-equilibrium</a></li>
        </ul>
        <h2>Tests:</h2>
        <ul>
          <li><a href="hands-view-realistic.html?device=leap" target="_blank">hands-view-realistic (Leap)</a></li>
          <li><a href="hands-view-realistic.html?device=realsense" target="_blank">hands-view-realistic (RealSense)</a></li>
          <li><a href="hands-view-simple.html" target="_blank">hands-view-simple</a></li>
          <li><a href="realsense-test.html" target="_blank">realsense-test</a></li>
          <li><a href="lab-add-rm-atom-test.html" target="_blank">lab-add-rm-atom-test</a></li>
          <li><a href="lab-add-rm-atom-test-swipe.html" target="_blank">lab-add-rm-atom-swipe</a></li>
          <li><a href="lab-temperature-absolute.html" target="_blank">lab-temperature-absolute</a></li>
          <li><a href="lab-temperature-delta.html" target="_blank">lab-temperature-delta</a></li>
        </ul>
        <h2>Old versions:</h2>
        <ul>
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