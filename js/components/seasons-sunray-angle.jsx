import React from 'react';
import reactMixin from 'react-mixin';
import iframePhone from 'iframe-phone';
import leapStateHandling from '../mixins/leap-state-handling';
import SunrayAngle from '../gestures/sunray-angle';
import LeapStandardInfo from './leap-standard-info.jsx';

export default class SeasonsSunrayAngle extends React.Component {
  componentDidMount() {
    this.sunrayAngle = new SunrayAngle(this.gestureDetected.bind(this), this.plotter);
    this.modelController = new ModelController();
    this.modelController.setupModelCommunication(this.refs.seasonsModel);
  }

  get plotter() {
    return this.refs.leapInfo.plotter;
  }

  nextLeapState(stateId, frame, data) {
    return this.sunrayAngle.nextLeapState(stateId, frame, data);
  }

  getStateMsg() {
    switch(this.state.leapState) {
      case 'initial':
        return 'Please keep you hand (left or right) steady above the Leap device.';
      case 'oneHandDetected':
        return 'One hand detected, you can rotate it now.';
    }
  }

  gestureDetected(angle) {
    this.modelController.setHandAngle(angle);
  }

  render() {
    return (
      <div>
        <iframe ref='seasonsModel' width='1220px' height='830px' scrolling='no' frameBorder='0' src='http://concord-consortium.github.io/grasp-seasons'/>
        <LeapStandardInfo ref='leapInfo' stateMsg={this.getStateMsg()}/>
      </div>
    );
  }
}

reactMixin.onClass(SeasonsSunrayAngle, leapStateHandling);

// Logic related to Seasons model:

const ANGLE_THRESHOLD = 20;
const DAY_THRESHOLD = 25;
const SUNRAY_HIGHLIGHT_COLOR = 'orange';
const SUNRAY_ERROR_COLOR = 'red';
const EARTH_TILT = 0.41;
const RAD_2_DEG = 180 / Math.PI;
const SUMMER_SOLSTICE = 171; // 171 day of year
const WINTER_SOLSTICE = SUMMER_SOLSTICE + 365 * 0.5;

class ModelController {
  constructor() {
    this.seasonsState = null;
    this.targetAngle = null;
    this.defaultSunrayColor = null;
    this.phone = null;
    this.resetInteractionState();
  }

  resetInteractionState() {
    this.withinTargetAngle = false;
    this.outOfRange = false;
    this.prevDay = null;
    if (this.phone && this.defaultSunrayColor) {
      this.phone.post('setSimState', {sunrayColor: this.defaultSunrayColor});
    }
  }

  setupModelCommunication(iframe) {
    if (this.phone) {
      this.phone.disconnect();
    }
    this.phone = new iframePhone.ParentEndpoint(iframe);
    this.phone.addListener('simState', this.setSeasonsState.bind(this));
    this.phone.post('observeSimState');
  }

  setHandAngle(angle) {
    if (Math.abs(angle - this.targetAngle) < ANGLE_THRESHOLD) {
      if (!this.withinTargetAngle) {
        this.withinTargetAngle = true;
        this.targetAngleReached();
      }
      this.updateTargetAngle(angle);
    } else {
      if (this.withinTargetAngle) {
        this.withinTargetAngle = false;
        this.targetAngleLost();
      }
    }
  }

  setSeasonsState(state) {
    this.seasonsState = state;
    this.targetAngle = this.sunrayAngle(this.seasonsState.day);
    this.resetInteractionState();
    // Save default / initial sunray color.
    if (!this.defaultSunrayColor) {
      this.defaultSunrayColor = state.sunrayColor;
    }
  }

  targetAngleReached() {
    this.phone.post('setSimState', {sunrayColor: SUNRAY_HIGHLIGHT_COLOR});
  }

  targetAngleLost() {
    this.phone.post('setSimState', {sunrayColor: this.defaultSunrayColor});
  }

  updateTargetAngle(newAngle) {
    if (Math.abs(newAngle - this.targetAngle) < 0.1) return;
    let maxAngle = this.sunrayAngle(SUMMER_SOLSTICE);
    let minAngle = this.sunrayAngle(WINTER_SOLSTICE);
    if (newAngle >= maxAngle && !this.outOfRange) {
      this.prevDay = this.seasonsState.day;
      this.outOfRange = true;
      this.seasonsState.day = SUMMER_SOLSTICE;
      this.targetAngle = maxAngle;
      this.phone.post('setSimState', {day: SUMMER_SOLSTICE, sunrayColor: SUNRAY_ERROR_COLOR});
      return;
    } else if (newAngle <= minAngle && !this.outOfRange) {
      this.prevDay = this.seasonsState.day;
      this.outOfRange = true;
      this.seasonsState.day = WINTER_SOLSTICE;
      this.targetAngle = minAngle;
      this.phone.post('setSimState', {day: WINTER_SOLSTICE, sunrayColor: SUNRAY_ERROR_COLOR});
      return;
    } else if (newAngle >= maxAngle || newAngle <= minAngle) {
      return;
    }
    this.outOfRange = false;
    let newDay = this.angleToDay(newAngle);
    let currentDay = this.seasonsState.day;
    if (currentDay === SUMMER_SOLSTICE) {
      if (this.prevDay > SUMMER_SOLSTICE) {
        // Go backwards.
        newDay = newDay.day1;
      } else {
        // Go forward.
        newDay = newDay.day2;
      }
    } else if (currentDay === WINTER_SOLSTICE) {
      if (this.prevDay > WINTER_SOLSTICE || this.prevDay < SUMMER_SOLSTICE) {
        // Go backwards.
        newDay = newDay.day2;
      } else {
        // Go forward.
        newDay = newDay.day1;
      }
    } else if (currentDay > SUMMER_SOLSTICE && currentDay < WINTER_SOLSTICE) {
      newDay = newDay.day2;
    } else {
      newDay = newDay.day1;
    }
    this.phone.post('setSimState', {day: newDay, sunrayColor: SUNRAY_HIGHLIGHT_COLOR});
    this.seasonsState.day = newDay;
    this.targetAngle = newAngle;
  }

  // WARNING: both functions are strictly related to logic in GRASP Seasons model.
  // Reference functions:
  // https://github.com/concord-consortium/grasp-seasons/blob/master/js/solar-system-data.js
  sunrayAngle(day) {
    // Angle of tilt axis, looked at from above (i.e., projected onto xy plane).
    // June solstice = 0, September equinox = pi/2, December solstice = pi, March equinox = 3pi/2.
    let tiltAxisZRadians = 2 * Math.PI * (day - SUMMER_SOLSTICE) / 365;
    // How much is a given latitude tilted up (+) or down (-) toward the ecliptic?
    // -23.5 degrees on June solstice, 0 degrees at equinoxes, +23.5 degrees on December solstice.
    let orbitalTiltDegrees = this.seasonsState.earthTilt ? EARTH_TILT * RAD_2_DEG : 0;
    let effectiveTiltDegrees = -Math.cos(tiltAxisZRadians) * orbitalTiltDegrees;
    return 90 - (this.seasonsState.lat + effectiveTiltDegrees);
  }

  angleToDay(angle) {
    // Inverse sunrayAngle function.
    // If you write out math equation, you can convert sunrayAngle to formula below:
    // angle = 90 - lat + Math.cos(2 * Math.PI * (day - SUMMER_SOLSTICE) / 365) * orbitalTiltDegrees
    // (angle - 90 + lat) / orbitalTiltDegrees = Math.cos(2 * Math.PI * (day - SUMMER_SOLSTICE) / 365)
    // Math.acos((angle - 90 + lat) / orbitalTiltDegrees)) = 2 * Math.PI * (day - SUMMER_SOLSTICE) / 365
    // 365 * Math.acos((angle - 90 + lat) / orbitalTiltDegrees)) = 2 * Math.PI * (day - SUMMER_SOLSTICE)
    // day - SUMMER_SOLSTICE = 365 * Math.acos((angle - 90 + lat) / orbitalTiltDegrees)) / (2 * Math.PI)
    let orbitalTiltDegrees = this.seasonsState.earthTilt ? EARTH_TILT * RAD_2_DEG : 0;
    let distFromSolstice =  365 * Math.acos((angle - 90 + this.seasonsState.lat) / orbitalTiltDegrees) / (2 * Math.PI);
    if (isNaN(distFromSolstice)) {
      return null;
    }
    let result = {day1: SUMMER_SOLSTICE - distFromSolstice, day2: SUMMER_SOLSTICE + distFromSolstice};
    if (result.day1 < 0) result.day1 += 365;
    return result;
  }
}
