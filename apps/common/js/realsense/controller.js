import EventEmitter from 'events';
import rs from './realsense';
const rsh = rs.hand;

function checkPlatform(onReady) {
  rs.SenseManager.detectPlatform(['hand'], ['front']).then(function (info) {
    if (info.nextStep === 'ready') {
      onReady();
    } else if (info.nextStep === 'unsupported') {
      throw new Error('Platform is not supported for Intel(R) RealSense(TM) SDK:' +
                      'either you are missing the required camera, or your OS and browser are not supported');
    } else if (info.nextStep === 'driver') {
      throw new Error('Please update your camera driver from your computer manufacturer.');
    } else if (info.nextStep === 'runtime') {
      throw new Error('Please download and install: https://software.intel.com/en-us/realsense/webapp_setup_v10.exe');
    }
  });
}

function handValid(hand) {
  return hand.bodySide !== rsh.BodySideType.BODY_SIDE_UNKNOWN &&
         hand.trackedJoints.length === rsh.NUMBER_OF_JOINTS; // 22
}

class RealSenseController {
  constructor() {
    this.sense = null;
    this.initStarted = false;
    this.dispatch = new EventEmitter();
    this.trackedHands = new Map();

    this.onConnect = this.onConnect.bind(this);
    this.onStatus = this.onStatus.bind(this);
    this.onHandData = this.onHandData.bind(this);
    this.onBeforeUnload = this.onBeforeUnload.bind(this);

    window.addEventListener('beforeunload', this.onBeforeUnload);

    // Delegate EventEmitter method.
    ['on', 'once', 'removeListener', 'emit'].forEach(method => {
      this[method] = this.dispatch[method].bind(this.dispatch);
    });
  }

  // Client code should always call this method. It doesn't do anything if controller is already connected.
  init() {
    if (!this.initStarted) {
      this.initStarted = true;
      checkPlatform(() => this._initRealSense());
    }
  }

  _initRealSense() {
    let handModule;
    let handConfig;
    // Create a SenseManager instance
    rs.SenseManager.createInstance().then(result => {
      this.sense = result;
      return rs.hand.HandModule.activate(this.sense);
    }).then(result => {
      handModule = result;
      // Set the on connect handler
      this.sense.onDeviceConnected = this.onConnect;
      // Set the status handler
      this.sense.onStatusChanged = this.onStatus;
      // Set the data handler
      handModule.onFrameProcessed = this.onHandData;
      // SenseManager Initialization
      return this.sense.init();
    }).then(_ => {
      // Configure Hand Tracking
      return handModule.createActiveConfiguration();
    }).then(result => {
      handConfig = result;
      // E.g. to enable all alerts:
      // handConfig.allAlerts = true;
      // Apply Hand Configuration changes
      return handConfig.applyChanges();
    }).then(_ => {
      return handConfig.release();
    }).then(_ => {
      // Start streaming data
      return this.sense.streamFrames();
    }).catch(error => {
      console.error('[RealSense] controller init failed: ' + error);
      throw error;
    });
  }

  onConnect(sender, connected) {
    console.log('[RealSense] connected: ' + connected);
    this.dispatch.emit('connect', connected);
  }

  onStatus(sender, status) {
    console.log('[RealSense] status changed: ' + status);
    this.dispatch.emit('status', status);
  }

  onHandData(sender, data) {
    data.hands = [];
    const validHandIds = new Set();
    (data.queryHandData(rsh.AccessOrderType.ACCESS_ORDER_FIXED) || []).forEach(hand => {
      if (hand && handValid(hand)) {
        data.hands.push(hand);
        if (!this.trackedHands.has(hand.uniqueId)) {
          this.onHandFound(hand);
        }
        this.trackedHands.set(hand.uniqueId, hand);
        validHandIds.add(hand.uniqueId);
      }
    });
    this.trackedHands.forEach((hand, uniqueId) => {
      if (!validHandIds.has(uniqueId)) {
        this.onHandLost(hand);
        this.trackedHands.delete(uniqueId);
      }
    });
    this.dispatch.emit('frame', data);
  }

  onHandFound(hand) {
    this.dispatch.emit('handFound', hand);
  }

  onHandLost(hand) {
    this.dispatch.emit('handLost', hand);
  }

  onBeforeUnload() {
    if (this.sense != null) {
      this.sense.release().then(_ => {
        this.sense = undefined;
      });
    }
  }
}

// Allow only one instance (singleton)
const controller = new RealSenseController();
export default controller;
