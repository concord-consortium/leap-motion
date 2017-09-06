import getURLParam from './get-url-param';
import iframePhone from 'iframe-phone';
const LOG_MANAGER_URL = '//cc-log-manager.herokuapp.com/api/logs';
const APP_NAME = 'GRASP';

const ID_LENGTH = 8;
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz';
function randomID() {
  let result = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    result += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
  }
  return result;
}

const INITIAL_STATE = {
  enabled: getURLParam('loggingEnabled', false),
  userId: getURLParam('userId', randomID())
};

function sendToLogManager(data) {
  const req = new XMLHttpRequest();
  req.addEventListener('load', function () {
    if (this.status < 200 || this.status >= 300) {
      console.warning('Log Manager error', this.statusText);
    }
  });
  req.addEventListener('error', function () {
    console.warning('Log Manager error', this.statusText);
  });
  req.open('POST', LOG_MANAGER_URL);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(JSON.stringify(data));
}

class Logger {
  constructor() {
    this.state = Object.assign({}, INITIAL_STATE);
    this.log = this.log.bind(this);
    this.logToLara = false;
    this.initInteractive = this.initInteractive.bind(this);
    this.initializeLaraConnection = this.initializeLaraConnection.bind(this);
    this.getAuthInfo = this.getAuthInfo.bind(this);
    this.terminateLaraConnection = this.terminateLaraConnection.bind(this);
  }

  initializeLaraConnection() {
    console.log('initializing');
    this.phone = iframePhone.getIFrameEndpoint();
    this.phone.addListener('initInteractive', this.initInteractive);
    this.phone.addListener('authInfo', this.getAuthInfo);
    this.phone.initialize();
  }

  initInteractive(data) {
    console.log('Init received from LARA container', data);
    this.logToLara = true;
    this.getAuthInfo();
  }

  getAuthInfo(data) {
    if (!data) {
      this.phone.post('getAuthInfo');
    } else {
      this.state.userId = data.email;
    }
  }

  terminateLaraConnection() {
    this.phone.disconnect();
  }

  log(action, parameters) {
    const { enabled, userId } = this.state;
    if (!this.logToLara && !enabled) return;
    const data = {};
    data.application = APP_NAME;
    data.username = userId;
    data.activity = window.location.pathname;
    data.url = window.location.href;
    data.event = action;
    data.time = Date.now();
    if (parameters) {
      data.parameters = parameters;
      if (parameters.value !== undefined) {
        data.event_value = parameters.value;
      }
    }
    if (this.logToLara) {
      this.sendToLara(data);
    }
    if (enabled) {
      sendToLogManager(data);
    }
    console.log('[log]', action, data);
  }

  sendToLara(data) {
    this.phone.post('log', { action: data.event, data: data });
  }

  setState(newState) {
    this.state = Object.assign({}, this.state, newState);
  }
}

const logger = new Logger();
export default logger;