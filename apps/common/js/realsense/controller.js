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

class RealSenseController {
  constructor() {
    this.sense = null;
    this.initStarted = false;
    this.dispatch = new EventEmitter();

    this.onConnect = this.onConnect.bind(this);
    this.onStatus = this.onStatus.bind(this);
    this.onHandData = this.onHandData.bind(this);
    this.onBeforeUnload = this.onBeforeUnload.bind(this);

    window.addEventListener('beforeunload', this.onBeforeUnload);

    // Delegate EventEmitter method.
    ['on', 'removeListener', 'emit'].forEach(method => {
      this[method] = function () {
        this.dispatch[method].apply(this.dispatch, arguments);
      };
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
      // Enable all alerts
      handConfig.allAlerts = true;
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
  }

  onStatus(sender, status) {
    console.log('[RealSense] status changed: ' + status);
  }

  onHandData(sender, data) {
    data.hands = data.queryHandData(rsh.AccessOrderType.ACCESS_ORDER_FIXED);
    this.dispatch.emit('frame', data);
  }

  // TODO: implement handFound and lost using RealSense alerts.
  onHandFound() {
    this.dispatch.emit('handFound');
  }

  onHandLost() {
    this.dispatch.emit('handLost');
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
