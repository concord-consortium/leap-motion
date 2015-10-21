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
        return 'Please keep you hand (left or right) steady above the Leap device.';
      case 'gestureDetected':
        return 'Rotate your hand to set the sun angle.';
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

// Logic related to Seasons model.
// IMPORTANT! Note that words "winter", "summer", "fall" and "spring" are used
// in the context of the northern hemisphere! It let's us unambiguously define time of the year.
// Some method names may initially look strange, e.g. "summerPolarNight" or "winterPolarNight".

const ANGLE_THRESHOLD = 20;
const MIN_ANGLE_DIFF = 0.1;
const POLAR_NIGHT_ANIM_SPEED = 0.9;
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
    // Handle "winter" polar night special case.
    if (newAngle === 0 && this.targetAngle === 0) {
      return this.winterPolarNightHandler();
    }
    // Handle "summer" polar night special case.
    if (newAngle === 180 && this.targetAngle === 180) {
      return this.summerPolarNightHandler();
    }
    if (Math.abs(newAngle - this.targetAngle) < MIN_ANGLE_DIFF) {
      // Do nothing, user probably is trying to keep his hand still.
      return;
    }
    // Limit angles to [0, 180] range.
    let maxAngle = Math.min(180, this.sunrayAngle(SUMMER_SOLSTICE));
    let minAngle = Math.max(0, this.sunrayAngle(WINTER_SOLSTICE));
    if (newAngle >= maxAngle - MIN_ANGLE_DIFF && !this.outOfRange) {
      return this.summerSolsticeReachedHandler(maxAngle);
    }
    if (newAngle <= minAngle + MIN_ANGLE_DIFF && !this.outOfRange) {
      return this.winterSolsticeReachedHandler(minAngle);
    }
    if (newAngle >= maxAngle || newAngle <= minAngle) {
      // Do nothing, summer/winterSolsticeReachedHandler has been already called (as .outOfRange is set to true).
      // Wait till user changes angle.
      return;
    }
    // Now we are sure that angle is correct (between min and max allowed angle for given latitude).
    this.outOfRange = false;
    let newDay = this.angleToDay(newAngle);
    let currentDay = this.seasonsState.day;
    if (currentDay === SUMMER_SOLSTICE) {
      // Special case - we're at summer solstice and need to change direction.
      if (this.summerOrFall(this.prevDay)) {
        // Go backwards.
        newDay = newDay.inWinterOrSpring;
      } else {
        // Go forward.
        newDay = newDay.inSummerOrFall;
      }
    } else if (currentDay === WINTER_SOLSTICE) {
      // Special case - we're at winter solstice and need to change direction.
      if (this.summerOrFall(this.prevDay)) {
        // Go forward.
        newDay = newDay.inWinterOrSpring;
      } else {
        // Go backwards.
        newDay = newDay.inSummerOrFall;
      }
    } else if (this.summerOrFall(currentDay)) {
      newDay = newDay.inSummerOrFall;
    } else {
      newDay = newDay.inWinterOrSpring;
    }
    this.phone.post('setSimState', {day: newDay, sunrayColor: SUNRAY_HIGHLIGHT_COLOR});
    this.seasonsState.day = newDay;
    this.targetAngle = newAngle;
  }

  // Just increase / decrease day number. User will see animation.
  summerPolarNightHandler() {
    let diff = this.summerOrFall(this.prevDay) ? -POLAR_NIGHT_ANIM_SPEED : POLAR_NIGHT_ANIM_SPEED;
    this.seasonsState.day = (this.seasonsState.day + diff + 365) % 365;
    this.targetAngle = Math.min(180, this.sunrayAngle(this.seasonsState.day));
    this.phone.post('setSimState', {day: this.seasonsState.day});
  }

  // Just increase / decrease day number. User will see animation.
  winterPolarNightHandler() {
    let diff = this.summerOrFall(this.prevDay) ? POLAR_NIGHT_ANIM_SPEED : -POLAR_NIGHT_ANIM_SPEED;
    this.seasonsState.day = (this.seasonsState.day + diff + 365) % 365;
    this.targetAngle = Math.max(0, this.sunrayAngle(this.seasonsState.day));
    this.phone.post('setSimState', {day: this.seasonsState.day});
  }

  // Called when user defines angle which is very close to summer solstice sunray angle.
  summerSolsticeReachedHandler(maxAngle) {
    this.prevDay = this.seasonsState.day;
    this.outOfRange = true;
    this.seasonsState.day = SUMMER_SOLSTICE;
    this.targetAngle = maxAngle;
    if (!this.summerPolarNight()) {
      this.seasonsState.day = SUMMER_SOLSTICE;
    } else {
      let newDay = this.angleToDay(180);
      // Set the first day which has angle equal to 180.
      this.seasonsState.day = this.summerOrFall(this.prevDay) ? newDay.inSummerOrFall : newDay.inWinterOrSpring;
    }
    this.phone.post('setSimState', {day: this.seasonsState.day, sunrayColor: SUNRAY_ERROR_COLOR});
  }

  // Called when user defines angle which is very close to winter solstice sunray angle.
  winterSolsticeReachedHandler(minAngle) {
    this.prevDay = this.seasonsState.day;
    this.outOfRange = true;
    this.targetAngle = minAngle;
    if (!this.winterPolarNight()) {
      this.seasonsState.day = WINTER_SOLSTICE;
    } else {
      let newDay = this.angleToDay(0);
      // Set the first day which has angle equal to 0.
      this.seasonsState.day = this.summerOrFall(this.prevDay) ? newDay.inSummerOrFall : newDay.inWinterOrSpring;
    }
    this.phone.post('setSimState', {day: this.seasonsState.day, sunrayColor: SUNRAY_ERROR_COLOR});
  }

  summerOrFall(day) {
    return day > SUMMER_SOLSTICE && day < WINTER_SOLSTICE;
  }

  winterPolarNight() {
    return this.sunrayAngle(WINTER_SOLSTICE) < 0;
  }

  summerPolarNight() {
    return this.sunrayAngle(SUMMER_SOLSTICE) > 180;
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

  // Returns two day numbers when the sun shines at given angle.
  // IMPORTANT:
  // Results consists of two days: {inWinterOrSpring: <...>, inSummerOrFall: <...>}
  // .inWinterOrSpring is always between WINTER_SOLSTICE and SUMMER_SOLSTICE (northern winter and spring).
  // .inSummerOrFall is always between SUMMER_SOLSTICE and WINTER_SOLSTICE (northern summer and fall).
  angleToDay(angle) {
    // Inverse of the sunrayAngle function.
    // If you write out math equation, you can convert #sunrayAngle to formula below:
    let orbitalTiltDegrees = this.seasonsState.earthTilt ? EARTH_TILT * RAD_2_DEG : 0;
    let distFromSolstice =  365 * Math.acos((angle - 90 + this.seasonsState.lat) / orbitalTiltDegrees) / (2 * Math.PI);
    if (isNaN(distFromSolstice)) {
      return null;
    }
    let result = {inWinterOrSpring: SUMMER_SOLSTICE - distFromSolstice, inSummerOrFall: SUMMER_SOLSTICE + distFromSolstice};
    if (result.inWinterOrSpring < 0) result.inWinterOrSpring += 365;
    return result;
  }
}
