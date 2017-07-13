import React from 'react';

export default () => {
  return (
    <div>
      <h3>Gas Pressure vs. Volume</h3>

      <p>
        Explore the relationship of pressure of a gas to its volume using a Leap Motion Controller attached to the computer.
      </p><p>
        Gases contained in a syringe can be compressed into smaller volumes. Following the prompts on screen, use the motion of your hands to change the pressure of the molecules of the gas. The closed fist of one hand represents the motion of the molecules. The flat hand represents the surface of the syringe plunger. What do the red squares that appear on the syringe plunger represent?
      </p>
        <ul>
        <li>
        How does the motion of your hands relate to the pressure?
        </li><li>
        How does changing pressure of a gas affect its volume?
        </li><li>
        Describe what gas pressure is using the motion of molecules?
        </li></ul>

      <hr/>
      <p><b>Note: Although the atoms in this model are in a flat plane, volume is calculated using 0.1 nm as the depth of the container.</b></p>
    </div>
  );
}
