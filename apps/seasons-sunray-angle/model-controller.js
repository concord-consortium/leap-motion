import extend from '../common/js/tools/extend';

// Logic related to Seasons model.
// IMPORTANT! Note that words "winter", "summer", "fall" and "spring" are used
// in the context of the northern hemisphere! It let's us unambiguously define time of the year.
// Some method names may initially look strange, e.g. "summerPolarNight" or "winterPolarNight".
const ANGLE_THRESHOLD = 15;
const INITIAL_ANGLE_THRESHOLD = 2;
const MIN_ANGLE_DIFF = 0.1;
const POLAR_NIGHT_ANIM_SPEED = 0.9;
const EARTH_TILT = 0.41;
const RAD_2_DEG = 180 / Math.PI;
const SUMMER_SOLSTICE = 171; // 171 day of year
const WINTER_SOLSTICE = SUMMER_SOLSTICE + 365 * 0.5;
const SPACE = 'space';
const GROUND = 'ground';

const AVAILABLE_CALLBACKS = {
  activeRayViewChanged: function (viewType) {}
};

export default class ModelController {
  constructor(callbacks) {
    this.targetAngle = null;
    this.seasons = null;
    this.callbacks = extend({}, AVAILABLE_CALLBACKS, callbacks);
    this.resetInteractionState();
  }

  setSeasonsState(state) {
    if (!this.seasons) return;
    // Last argument ensures that Seasons won't emit `simState.change` event.
    // We are interested only in changes caused by the Seasons UI, not our own.
    this.seasons.setSimState(state, undefined, true);
  }

  get seasonsState() {
    return this.seasons ? this.seasons.state.sim : {};
  }

  get activeRaysView() {
    if (!this.seasons) {
      // If seasons isn't loaded yet, return true since the ground view control is the default view.
      return GROUND;
    }
    let viewState = this.seasons.state.view;
    let result = GROUND;
    ['small-bottom', 'small-top', 'main'].forEach(function (pos) {
      if (viewState[pos] === 'raysGround') result = GROUND;
      if (viewState[pos] === 'raysSpace') result = SPACE;
    });
    return result;
  }

  get activeViewPanel() {
    let result = 'main';
    if (!this.seasons) {
      // If seasons isn't loaded yet, return 'main' since the view control is the default view.
      return result;
    }
    let viewState = this.seasons.state.view;
    ['small-bottom', 'small-top', 'main'].forEach(function (pos) {
      if (viewState[pos] === 'raysGround' || viewState[pos] === 'raysSpace') result = pos;
    });
    return result;
  }

  resetInteractionState() {
    this.outOfRange = false;
    this.prevDay = null;
    this.prevTargetAngle = null;
    this.withinTargetAngle = false;
  }

  setupModelCommunication(seasonsComponent) {
    this.seasons = seasonsComponent;
    this.seasons.on('simState.change', this.handleSimStateUpdate.bind(this));
    this.seasons.on('viewState.change', () => {
      this.handleSimStateUpdate();
      this.callbacks.activeRayViewChanged(this.activeRaysView)
      this.callbacks.activeViewPanelChanged(this.activeViewPanel)
    });
    this.handleSimStateUpdate();
  }

  setAnimButtonsDisabled(v) {
    this.seasons.setPlayBtnDisabled(v);
    this.seasons.setRotatingBtnDisabled(v);
  }

  withinSunrayAngle(handAngle) {
    // User needs to "find" current angle (targetAngle) first.
    // Only then he can modify it.
    const threshold = this.withinTargetAngle ? ANGLE_THRESHOLD : INITIAL_ANGLE_THRESHOLD;
    return Math.abs(handAngle - this.targetAngle) < threshold;
  }

  setAngle(angle) {
    if (this.withinSunrayAngle(angle)) {
      this.withinTargetAngle = true;
      this.updateTargetAngle(angle);
      return true;
    }
    this.withinTargetAngle = false;
    return false;
  }

  setHandAngle(angle) {
    if (this.activeRaysView === SPACE) {
      // In horizontal view user controls ground, not rays.
      angle = 180 - angle;
    }
    return this.setAngle(angle);
  }

  handDistanceToAngle(dist) {
    let maxAngle = this.maxAngle;
    let minAngle = this.minAngle;
    // Distance between rays is defined between 0 (min) and 1 (max).
    // It can be translated only to [0, 90] range, but we need to support [0, 180].
    if (maxAngle > 90 && minAngle > 90) {
      let tmp = minAngle;
      minAngle = 180 - maxAngle;
      maxAngle = 180 - tmp;
    } else if (maxAngle > 90 && minAngle < 90) {
      minAngle = Math.min(180 - maxAngle, minAngle);
      maxAngle = 90;
    }
    let angle = (1 - dist) * (maxAngle - minAngle) + minAngle;

    if (this.targetAngle > 90) {
      angle = 180 - angle;
    } else if (this.targetAngle === 90 && this.prevTargetAngle < 90) {
      // Change direction.
      angle = 180 - angle;
    }
    return angle;
  }

  setHandDistance(dist) {
    const angle = this.handDistanceToAngle(dist);
    if (this.targetAngle !== 90) this.prevTargetAngle = this.targetAngle;
    return this.setAngle(angle);
  }

  handleSimStateUpdate() {
    this.targetAngle = this.sunrayAngle(this.seasonsState.day);
    this.resetInteractionState();
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
    let maxAngle = this.maxAngle;
    let minAngle = this.minAngle;
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
    this.setSeasonsState({day: newDay});
    this.targetAngle = newAngle;
  }

  // Just increase / decrease day number. User will see animation.
  summerPolarNightHandler() {
    let diff = this.summerOrFall(this.prevDay) ? -POLAR_NIGHT_ANIM_SPEED : POLAR_NIGHT_ANIM_SPEED;
    let newDay = (this.seasonsState.day + diff + 365) % 365;
    this.targetAngle = Math.min(180, this.sunrayAngle(newDay));
    this.setSeasonsState({day: newDay});
  }

  // Just increase / decrease day number. User will see animation.
  winterPolarNightHandler() {
    let diff = this.summerOrFall(this.prevDay) ? POLAR_NIGHT_ANIM_SPEED : -POLAR_NIGHT_ANIM_SPEED;
    let newDay = (this.seasonsState.day + diff + 365) % 365;
    this.targetAngle = Math.max(0, this.sunrayAngle(newDay));
    this.setSeasonsState({day: newDay});
  }

  // Called when user defines angle which is very close to summer solstice sunray angle.
  summerSolsticeReachedHandler(maxAngle) {
    this.prevDay = this.seasonsState.day;
    this.outOfRange = true;
    let newDay = SUMMER_SOLSTICE;
    this.targetAngle = maxAngle;
    if (!this.summerPolarNight()) {
      newDay = SUMMER_SOLSTICE;
    } else {
      newDay = this.angleToDay(180);
      // Set the first day which has angle equal to 180.
      newDay = this.summerOrFall(this.prevDay) ? newDay.inSummerOrFall : newDay.inWinterOrSpring;
    }
    this.setSeasonsState({day: newDay});
  }

  // Called when user defines angle which is very close to winter solstice sunray angle.
  winterSolsticeReachedHandler(minAngle) {
    this.prevDay = this.seasonsState.day;
    this.outOfRange = true;
    this.targetAngle = minAngle;
    let newDay;
    if (!this.winterPolarNight()) {
      newDay = WINTER_SOLSTICE;
    } else {
      newDay = this.angleToDay(0);
      // Set the first day which has angle equal to 0.
      newDay = this.summerOrFall(this.prevDay) ? newDay.inSummerOrFall : newDay.inWinterOrSpring;
    }
    this.setSeasonsState({day: newDay});
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

  get maxAngle() {
    return Math.min(180, this.sunrayAngle(SUMMER_SOLSTICE));
  }

  get minAngle() {
    return Math.max(0, this.sunrayAngle(WINTER_SOLSTICE));
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
