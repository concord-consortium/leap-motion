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
const SPACE = 'raysSpace';
const GROUND = 'raysGround';
const ORBIT = 'orbit';

const AVAILABLE_CALLBACKS = {
  activeRayViewChanged: function (viewType) {}
};

function mouseEvent(type, sx, sy, cx, cy) {
  var evt;
  var e = {
    bubbles: true,
    cancelable: (type != 'mousemove'),
    view: window,
    detail: 0,
    screenX: sx,
    screenY: sy,
    clientX: cx,
    clientY: cy,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: 0,
    relatedTarget: undefined
  };
  if (typeof( document.createEvent ) == 'function') {
    evt = document.createEvent('MouseEvents');
    evt.initMouseEvent(type,
      e.bubbles, e.cancelable, e.view, e.detail,
      e.screenX, e.screenY, e.clientX, e.clientY,
      e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
      e.button, document.body.parentNode);
  } else if (document.createEventObject) {
    evt = document.createEventObject();
    for (let prop in e) {
      evt[prop] = e[prop];
    }
    evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
  }
  return evt;
}
function dispatchEvent (el, evt) {
  if (el.dispatchEvent) {
    el.dispatchEvent(evt);
  } else if (el.fireEvent) {
    el.fireEvent('on' + evt.type, evt);
  }
  return evt;
}

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

  get seasonsView() {
    return this.seasons ? this.seasons.state.view : {};
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
      else if (viewState[pos] === 'raysSpace') result = SPACE;
      else if (viewState[pos] === 'orbit') result = ORBIT;
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
      if (viewState[pos] === 'raysGround' || viewState[pos] === 'raysSpace' || viewState[pos] === 'orbit') result = pos;
    });
    return result;
  }

  resetInteractionState() {
    this.outOfRange = false;
    this.prevDay = null;
    this.prevTargetAngle = null;
    this.withinTargetAngle = false;
  }

  setSeasonsComponent(seasonsComponent) {
    this.seasons = seasonsComponent;
    this.handleSimStateChange();
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

  setHandAngle(angle, view) {
    if (view === SPACE) {
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

  handleSimStateChange() {
    this.targetAngle = this.sunrayAngle(this.seasonsState.day);
    this.resetInteractionState();
  }

  handleViewStateChange() {
    this.handleSimStateChange();
    this.callbacks.activeRayViewChanged(this.activeRaysView);
    this.callbacks.activeViewPanelChanged(this.activeViewPanel);
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

  getInteractionData(x, y, activeViewPanel) {
    let pos = { x, y };
    let seasonsContainer = document.getElementsByClassName('seasons-container')[0];

    let view = seasonsContainer.getElementsByClassName('view ' + activeViewPanel)[0];
    let canvas = view.getElementsByTagName('canvas')[0];

    let rect = view.getBoundingClientRect();
    pos.x = x / window.devicePixelRatio + rect.left;
    pos.y = y / window.devicePixelRatio + rect.top;

    let interactionData = {};
    let coords = {};
    coords.screenX = pos.x;
    coords.screenY = pos.y;
    coords.clientX = pos.x;
    coords.clientY = pos.y;

    interactionData.canvas = canvas;
    interactionData.coords = coords;

    return interactionData;
  }

  startOrbitInteraction(x, y, activeViewPanel) {
    // mouse down on the earth
    let interactionData = this.getInteractionData(x, y, activeViewPanel);
    let coords = interactionData.coords;

    let evtMove = mouseEvent('mousemove', coords.screenX, coords.screenY, coords.clientX, coords.clientY);
    let evtDown = mouseEvent('mousedown', coords.screenX, coords.screenY, coords.clientX, coords.clientY);
    dispatchEvent(interactionData.canvas, evtMove);
    setTimeout(function () {
      dispatchEvent(interactionData.canvas, evtDown);
    }, 10);

  }

  handleOrbitInteraction(x, y, dx, dy, activeViewPanel) {
    // for changes in movement of dx and dy, simulate dragging earth at screen coordinates x and y
    let interactionData = this.getInteractionData(x, y, activeViewPanel);
    let coords = interactionData.coords;
    let moveMagnitude = 4;

    let evtDown = mouseEvent('mousedown', coords.screenX, coords.screenY, coords.clientX, coords.clientY);
    let evtMove = mouseEvent('mousemove', coords.screenX + (dx * moveMagnitude), coords.screenY + (dy * moveMagnitude), coords.clientX + (dx * moveMagnitude), coords.clientY + (dy * moveMagnitude));

    dispatchEvent(interactionData.canvas, evtDown);
    dispatchEvent(interactionData.canvas, evtMove);
  }

  finishOrbitInteraction(x, y, activeViewPanel) {
    let interactionData = this.getInteractionData(x, y, activeViewPanel);
    let coords = interactionData.coords;
    let moveMagnitude = 100;

    let evtUp = mouseEvent('mouseup', coords.screenX, coords.screenY, coords.clientX, coords.clientY);
    let evtMove = mouseEvent('mousemove', coords.screenX + moveMagnitude, coords.screenY + moveMagnitude, coords.clientX + moveMagnitude, coords.clientY + moveMagnitude);
    dispatchEvent(interactionData.canvas, evtUp);

    setTimeout(function () {
      dispatchEvent(interactionData.canvas, evtMove);
    }, 20);

  }
}
