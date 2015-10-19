webpackJsonp([8],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(1)['default'];

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	var _reactDom = __webpack_require__(158);

	var _reactDom2 = _interopRequireDefault(_reactDom);

	var _componentsSeasonsSunrayAngleJsx = __webpack_require__(260);

	var _componentsSeasonsSunrayAngleJsx2 = _interopRequireDefault(_componentsSeasonsSunrayAngleJsx);

	__webpack_require__(241);

	_reactDom2['default'].render(_react2['default'].createElement(_componentsSeasonsSunrayAngleJsx2['default'], null), document.getElementById('app'));

/***/ },

/***/ 249:
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  /**
	   * Allows to communicate with an iframe.
	   */
	  ParentEndpoint:  __webpack_require__(250),
	  /**
	   * Allows to communicate with a parent page.
	   * IFrameEndpoint is a singleton, as iframe can't have multiple parents anyway.
	   */
	  getIFrameEndpoint: __webpack_require__(252),
	  structuredClone: __webpack_require__(251),

	  // TODO: May be misnamed
	  IframePhoneRpcEndpoint: __webpack_require__(253)

	};


/***/ },

/***/ 250:
/***/ function(module, exports, __webpack_require__) {

	var structuredClone = __webpack_require__(251);

	/**
	  Call as:
	    new ParentEndpoint(targetWindow, targetOrigin, afterConnectedCallback)
	      targetWindow is a WindowProxy object. (Messages will be sent to it)

	      targetOrigin is the origin of the targetWindow. (Messages will be restricted to this origin)

	      afterConnectedCallback is an optional callback function to be called when the connection is
	        established.

	  OR (less secure):
	    new ParentEndpoint(targetIframe, afterConnectedCallback)

	      targetIframe is a DOM object (HTMLIframeElement); messages will be sent to its contentWindow.

	      afterConnectedCallback is an optional callback function

	    In this latter case, targetOrigin will be inferred from the value of the src attribute of the
	    provided DOM object at the time of the constructor invocation. This is less secure because the
	    iframe might have been navigated to an unexpected domain before constructor invocation.

	  Note that it is important to specify the expected origin of the iframe's content to safeguard
	  against sending messages to an unexpected domain. This might happen if our iframe is navigated to
	  a third-party URL unexpectedly. Furthermore, having a reference to Window object (as in the first
	  form of the constructor) does not protect against sending a message to the wrong domain. The
	  window object is actualy a WindowProxy which transparently proxies the Window object of the
	  underlying iframe, so that when the iframe is navigated, the "same" WindowProxy now references a
	  completely differeent Window object, possibly controlled by a hostile domain.

	  See http://www.esdiscuss.org/topic/a-dom-use-case-that-can-t-be-emulated-with-direct-proxies for
	  more about this weird behavior of WindowProxies (the type returned by <iframe>.contentWindow).
	*/

	module.exports = function ParentEndpoint(targetWindowOrIframeEl, targetOrigin, afterConnectedCallback) {
	  var selfOrigin = window.location.href.match(/(.*?\/\/.*?)\//)[1];
	  var postMessageQueue = [];
	  var connected = false;
	  var handlers = {};
	  var targetWindowIsIframeElement;

	  function getOrigin(iframe) {
	    return iframe.src.match(/(.*?\/\/.*?)\//)[1];
	  }

	  function post(type, content) {
	    var message;
	    // Message object can be constructed from 'type' and 'content' arguments or it can be passed
	    // as the first argument.
	    if (arguments.length === 1 && typeof type === 'object' && typeof type.type === 'string') {
	      message = type;
	    } else {
	      message = {
	        type: type,
	        content: content
	      };
	    }
	    if (connected) {
	      var tWindow = getTargetWindow();
	      // if we are laready connected ... send the message
	      message.origin = selfOrigin;
	      // See http://dev.opera.com/articles/view/window-postmessage-messagechannel/#crossdoc
	      //     https://github.com/Modernizr/Modernizr/issues/388
	      //     http://jsfiddle.net/ryanseddon/uZTgD/2/
	      if (structuredClone.supported()) {
	        tWindow.postMessage(message, targetOrigin);
	      } else {
	        tWindow.postMessage(JSON.stringify(message), targetOrigin);
	      }
	    } else {
	      // else queue up the messages to send after connection complete.
	      postMessageQueue.push(message);
	    }
	  }

	  function addListener(messageName, func) {
	    handlers[messageName] = func;
	  }

	  function removeListener(messageName) {
	    handlers[messageName] = null;
	  }

	  // Note that this function can't be used when IFrame element hasn't been added to DOM yet
	  // (.contentWindow would be null). At the moment risk is purely theoretical, as the parent endpoint
	  // only listens for an incoming 'hello' message and the first time we call this function
	  // is in #receiveMessage handler (so iframe had to be initialized before, as it could send 'hello').
	  // It would become important when we decide to refactor the way how communication is initialized.
	  function getTargetWindow() {
	    if (targetWindowIsIframeElement) {
	      var tWindow = targetWindowOrIframeEl.contentWindow;
	      if (!tWindow) {
	        throw "IFrame element needs to be added to DOM before communication " +
	              "can be started (.contentWindow is not available)";
	      }
	      return tWindow;
	    }
	    return targetWindowOrIframeEl;
	  }

	  function receiveMessage(message) {
	    var messageData;
	    if (message.source === getTargetWindow() && message.origin === targetOrigin) {
	      messageData = message.data;
	      if (typeof messageData === 'string') {
	        messageData = JSON.parse(messageData);
	      }
	      if (handlers[messageData.type]) {
	        handlers[messageData.type](messageData.content);
	      } else {
	        console.log("cant handle type: " + messageData.type);
	      }
	    }
	  }

	  function disconnect() {
	    connected = false;
	    window.removeEventListener('message', receiveMessage);
	  }

	  // handle the case that targetWindowOrIframeEl is actually an <iframe> rather than a Window(Proxy) object
	  // Note that if it *is* a WindowProxy, this probe will throw a SecurityException, but in that case
	  // we also don't need to do anything
	  try {
	    targetWindowIsIframeElement = targetWindowOrIframeEl.constructor === HTMLIFrameElement;
	  } catch (e) {
	    targetWindowIsIframeElement = false;
	  }

	  if (targetWindowIsIframeElement) {
	    // Infer the origin ONLY if the user did not supply an explicit origin, i.e., if the second
	    // argument is empty or is actually a callback (meaning it is supposed to be the
	    // afterConnectionCallback)
	    if (!targetOrigin || targetOrigin.constructor === Function) {
	      afterConnectedCallback = targetOrigin;
	      targetOrigin = getOrigin(targetWindowOrIframeEl);
	    }
	  }

	  // when we receive 'hello':
	  addListener('hello', function() {
	    connected = true;

	    // send hello response
	    post('hello');

	    // give the user a chance to do things now that we are connected
	    // note that is will happen before any queued messages
	    if (afterConnectedCallback && typeof afterConnectedCallback === "function") {
	      afterConnectedCallback();
	    }

	    // Now send any messages that have been queued up ...
	    while(postMessageQueue.length > 0) {
	      post(postMessageQueue.shift());
	    }
	  });

	  window.addEventListener('message', receiveMessage, false);

	  // Public API.
	  return {
	    post: post,
	    addListener: addListener,
	    removeListener: removeListener,
	    disconnect: disconnect,
	    getTargetWindow: getTargetWindow,
	    targetOrigin: targetOrigin
	  };
	};


/***/ },

/***/ 251:
/***/ function(module, exports) {

	var featureSupported = false;

	(function () {
	  var result = 0;

	  if (!!window.postMessage) {
	    try {
	      // Safari 5.1 will sometimes throw an exception and sometimes won't, lolwut?
	      // When it doesn't we capture the message event and check the
	      // internal [[Class]] property of the message being passed through.
	      // Safari will pass through DOM nodes as Null iOS safari on the other hand
	      // passes it through as DOMWindow, gotcha.
	      window.onmessage = function(e){
	        var type = Object.prototype.toString.call(e.data);
	        result = (type.indexOf("Null") != -1 || type.indexOf("DOMWindow") != -1) ? 1 : 0;
	        featureSupported = {
	          'structuredClones': result
	        };
	      };
	      // Spec states you can't transmit DOM nodes and it will throw an error
	      // postMessage implimentations that support cloned data will throw.
	      window.postMessage(document.createElement("a"),"*");
	    } catch(e) {
	      // BBOS6 throws but doesn't pass through the correct exception
	      // so check error message
	      result = (e.DATA_CLONE_ERR || e.message == "Cannot post cyclic structures.") ? 1 : 0;
	      featureSupported = {
	        'structuredClones': result
	      };
	    }
	  }
	}());

	exports.supported = function supported() {
	  return featureSupported && featureSupported.structuredClones > 0;
	};


/***/ },

/***/ 252:
/***/ function(module, exports, __webpack_require__) {

	var structuredClone = __webpack_require__(251);
	var HELLO_INTERVAL_LENGTH = 200;
	var HELLO_TIMEOUT_LENGTH = 60000;

	function IFrameEndpoint() {
	  var parentOrigin;
	  var listeners = {};
	  var isInitialized = false;
	  var connected = false;
	  var postMessageQueue = [];
	  var helloInterval;

	  function postToTarget(message, target) {
	    // See http://dev.opera.com/articles/view/window-postmessage-messagechannel/#crossdoc
	    //     https://github.com/Modernizr/Modernizr/issues/388
	    //     http://jsfiddle.net/ryanseddon/uZTgD/2/
	    if (structuredClone.supported()) {
	      window.parent.postMessage(message, target);
	    } else {
	      window.parent.postMessage(JSON.stringify(message), target);
	    }
	  }

	  function post(type, content) {
	    var message;
	    // Message object can be constructed from 'type' and 'content' arguments or it can be passed
	    // as the first argument.
	    if (arguments.length === 1 && typeof type === 'object' && typeof type.type === 'string') {
	      message = type;
	    } else {
	      message = {
	        type: type,
	        content: content
	      };
	    }
	    if (connected) {
	      postToTarget(message, parentOrigin);
	    } else {
	      postMessageQueue.push(message);
	    }
	  }

	  // Only the initial 'hello' message goes permissively to a '*' target (because due to cross origin
	  // restrictions we can't find out our parent's origin until they voluntarily send us a message
	  // with it.)
	  function postHello() {
	    postToTarget({
	      type: 'hello',
	      origin: document.location.href.match(/(.*?\/\/.*?)\//)[1]
	    }, '*');
	  }

	  function addListener(type, fn) {
	    listeners[type] = fn;
	  }

	  function removeAllListeners() {
	    listeners = {};
	  }

	  function getListenerNames() {
	    return Object.keys(listeners);
	  }

	  function messageListener(message) {
	      // Anyone can send us a message. Only pay attention to messages from parent.
	      if (message.source !== window.parent) return;

	      var messageData = message.data;

	      if (typeof messageData === 'string') messageData = JSON.parse(messageData);

	      // We don't know origin property of parent window until it tells us.
	      if (!connected && messageData.type === 'hello') {
	        // This is the return handshake from the embedding window.
	        parentOrigin = messageData.origin;
	        connected = true;
	        stopPostingHello();
	        while(postMessageQueue.length > 0) {
	          post(postMessageQueue.shift());
	        }
	      }

	      // Perhaps-redundantly insist on checking origin as well as source window of message.
	      if (message.origin === parentOrigin) {
	        if (listeners[messageData.type]) listeners[messageData.type](messageData.content);
	      }
	   }

	   function disconnect() {
	     connected = false;
	     stopPostingHello();
	     window.removeEventListener('message', messsageListener);
	   }

	  /**
	    Initialize communication with the parent frame. This should not be called until the app's custom
	    listeners are registered (via our 'addListener' public method) because, once we open the
	    communication, the parent window may send any messages it may have queued. Messages for which
	    we don't have handlers will be silently ignored.
	  */
	  function initialize() {
	    if (isInitialized) {
	      return;
	    }
	    isInitialized = true;
	    if (window.parent === window) return;

	    // We kick off communication with the parent window by sending a "hello" message. Then we wait
	    // for a handshake (another "hello" message) from the parent window.
	    postHello();
	    startPostingHello();
	    window.addEventListener('message', messageListener, false);
	  }

	  function startPostingHello() {
	    if (helloInterval) {
	      stopPostingHello();
	    }
	    helloInterval = window.setInterval(postHello, HELLO_INTERVAL_LENGTH);
	    window.setTimeout(stopPostingHello, HELLO_TIMEOUT_LENGTH);
	  }

	  function stopPostingHello() {
	    window.clearInterval(helloInterval);
	    helloInterval = null;
	  }

	  // Public API.
	  return {
	    initialize        : initialize,
	    getListenerNames  : getListenerNames,
	    addListener       : addListener,
	    removeAllListeners: removeAllListeners,
	    disconnect        : disconnect,
	    post              : post
	  };
	}

	var instance = null;

	// IFrameEndpoint is a singleton, as iframe can't have multiple parents anyway.
	module.exports = function getIFrameEndpoint() {
	  if (!instance) {
	    instance = new IFrameEndpoint();
	  }
	  return instance;
	};

/***/ },

/***/ 253:
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var ParentEndpoint = __webpack_require__(250);
	var getIFrameEndpoint = __webpack_require__(252);

	// Not a real UUID as there's an RFC for that (needed for proper distributed computing).
	// But in this fairly parochial situation, we just need to be fairly sure to avoid repeats.
	function getPseudoUUID() {
	    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	    var len = chars.length;
	    var ret = [];

	    for (var i = 0; i < 10; i++) {
	        ret.push(chars[Math.floor(Math.random() * len)]);
	    }
	    return ret.join('');
	}

	module.exports = function IframePhoneRpcEndpoint(handler, namespace, targetWindow, targetOrigin, phone) {
	    var pendingCallbacks = Object.create({});

	    // if it's a non-null object, rather than a function, 'handler' is really an options object
	    if (handler && typeof handler === 'object') {
	        namespace = handler.namespace;
	        targetWindow = handler.targetWindow;
	        targetOrigin = handler.targetOrigin;
	        phone = handler.phone;
	        handler = handler.handler;
	    }

	    if ( ! phone ) {
	        if (targetWindow === window.parent) {
	            phone = getIFrameEndpoint();
	            phone.initialize();
	        } else {
	            phone = new ParentEndpoint(targetWindow, targetOrigin);
	        }
	    }

	    phone.addListener(namespace, function(message) {
	        var callbackObj;

	        if (message.messageType === 'call' && typeof this.handler === 'function') {
	            this.handler.call(undefined, message.value, function(returnValue) {
	                phone.post(namespace, {
	                    messageType: 'returnValue',
	                    uuid: message.uuid,
	                    value: returnValue
	                });
	            });
	        } else if (message.messageType === 'returnValue') {
	            callbackObj = pendingCallbacks[message.uuid];

	            if (callbackObj) {
	                window.clearTimeout(callbackObj.timeout);
	                if (callbackObj.callback) {
	                    callbackObj.callback.call(undefined, message.value);
	                }
	                pendingCallbacks[message.uuid] = null;
	            }
	        }
	    }.bind(this));

	    function call(message, callback) {
	        var uuid = getPseudoUUID();

	        pendingCallbacks[uuid] = {
	            callback: callback,
	            timeout: window.setTimeout(function() {
	                if (callback) {
	                    callback(undefined, new Error("IframePhone timed out waiting for reply"));
	                }
	            }, 2000)
	        };

	        phone.post(namespace, {
	            messageType: 'call',
	            uuid: uuid,
	            value: message
	        });
	    }

	    function disconnect() {
	        phone.disconnect();
	    }

	    this.handler = handler;
	    this.call = call.bind(this);
	    this.disconnect = disconnect.bind(this);
	};


/***/ },

/***/ 260:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _get = __webpack_require__(160)['default'];

	var _inherits = __webpack_require__(174)['default'];

	var _createClass = __webpack_require__(185)['default'];

	var _classCallCheck = __webpack_require__(188)['default'];

	var _interopRequireDefault = __webpack_require__(1)['default'];

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	var _reactMixin = __webpack_require__(189);

	var _reactMixin2 = _interopRequireDefault(_reactMixin);

	var _iframePhone = __webpack_require__(249);

	var _iframePhone2 = _interopRequireDefault(_iframePhone);

	var _mixinsLeapStateHandling = __webpack_require__(192);

	var _mixinsLeapStateHandling2 = _interopRequireDefault(_mixinsLeapStateHandling);

	var _gesturesSunrayAngle = __webpack_require__(261);

	var _gesturesSunrayAngle2 = _interopRequireDefault(_gesturesSunrayAngle);

	var _leapStandardInfoJsx = __webpack_require__(227);

	var _leapStandardInfoJsx2 = _interopRequireDefault(_leapStandardInfoJsx);

	var SeasonsSunrayAngle = (function (_React$Component) {
	  _inherits(SeasonsSunrayAngle, _React$Component);

	  function SeasonsSunrayAngle() {
	    _classCallCheck(this, SeasonsSunrayAngle);

	    _get(Object.getPrototypeOf(SeasonsSunrayAngle.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(SeasonsSunrayAngle, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.sunrayAngle = new _gesturesSunrayAngle2['default'](this.gestureDetected.bind(this), this.plotter);
	      this.modelController = new ModelController();
	      this.modelController.setupModelCommunication(this.refs.seasonsModel);
	    }
	  }, {
	    key: 'nextLeapState',
	    value: function nextLeapState(stateId, frame, data) {
	      return this.sunrayAngle.nextLeapState(stateId, frame, data);
	    }
	  }, {
	    key: 'getStateMsg',
	    value: function getStateMsg() {
	      switch (this.state.leapState) {
	        case 'initial':
	          return 'Please keep you hand (left or right) steady above the Leap device.';
	        case 'oneHandDetected':
	          return 'One hand detected, you can rotate it now.';
	      }
	    }
	  }, {
	    key: 'gestureDetected',
	    value: function gestureDetected(angle) {
	      this.modelController.setHandAngle(angle);
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return _react2['default'].createElement(
	        'div',
	        null,
	        _react2['default'].createElement('iframe', { ref: 'seasonsModel', width: '1220px', height: '830px', scrolling: 'no', frameBorder: '0', src: 'http://concord-consortium.github.io/grasp-seasons' }),
	        _react2['default'].createElement(_leapStandardInfoJsx2['default'], { ref: 'leapInfo', stateMsg: this.getStateMsg() })
	      );
	    }
	  }, {
	    key: 'plotter',
	    get: function get() {
	      return this.refs.leapInfo.plotter;
	    }
	  }]);

	  return SeasonsSunrayAngle;
	})(_react2['default'].Component);

	exports['default'] = SeasonsSunrayAngle;

	_reactMixin2['default'].onClass(SeasonsSunrayAngle, _mixinsLeapStateHandling2['default']);

	// Logic related to Seasons model:

	var ANGLE_THRESHOLD = 20;
	var DAY_THRESHOLD = 25;
	var SUNRAY_HIGHLIGHT_COLOR = 'orange';
	var SUNRAY_ERROR_COLOR = 'red';
	var EARTH_TILT = 0.41;
	var RAD_2_DEG = 180 / Math.PI;
	var SUMMER_SOLSTICE = 171; // 171 day of year
	var WINTER_SOLSTICE = SUMMER_SOLSTICE + 365 * 0.5;

	var ModelController = (function () {
	  function ModelController() {
	    _classCallCheck(this, ModelController);

	    this.seasonsState = null;
	    this.targetAngle = null;
	    this.defaultSunrayColor = null;
	    this.phone = null;
	    this.resetInteractionState();
	  }

	  _createClass(ModelController, [{
	    key: 'resetInteractionState',
	    value: function resetInteractionState() {
	      this.withinTargetAngle = false;
	      this.outOfRange = false;
	      this.prevDay = null;
	      if (this.phone && this.defaultSunrayColor) {
	        this.phone.post('setSimState', { sunrayColor: this.defaultSunrayColor });
	      }
	    }
	  }, {
	    key: 'setupModelCommunication',
	    value: function setupModelCommunication(iframe) {
	      if (this.phone) {
	        this.phone.disconnect();
	      }
	      this.phone = new _iframePhone2['default'].ParentEndpoint(iframe);
	      this.phone.addListener('simState', this.setSeasonsState.bind(this));
	      this.phone.post('observeSimState');
	    }
	  }, {
	    key: 'setHandAngle',
	    value: function setHandAngle(angle) {
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
	  }, {
	    key: 'setSeasonsState',
	    value: function setSeasonsState(state) {
	      this.seasonsState = state;
	      this.targetAngle = this.sunrayAngle(this.seasonsState.day);
	      this.resetInteractionState();
	      // Save default / initial sunray color.
	      if (!this.defaultSunrayColor) {
	        this.defaultSunrayColor = state.sunrayColor;
	      }
	    }
	  }, {
	    key: 'targetAngleReached',
	    value: function targetAngleReached() {
	      this.phone.post('setSimState', { sunrayColor: SUNRAY_HIGHLIGHT_COLOR });
	    }
	  }, {
	    key: 'targetAngleLost',
	    value: function targetAngleLost() {
	      this.phone.post('setSimState', { sunrayColor: this.defaultSunrayColor });
	    }
	  }, {
	    key: 'updateTargetAngle',
	    value: function updateTargetAngle(newAngle) {
	      if (Math.abs(newAngle - this.targetAngle) < 0.1) return;
	      var maxAngle = this.sunrayAngle(SUMMER_SOLSTICE);
	      var minAngle = this.sunrayAngle(WINTER_SOLSTICE);
	      if (newAngle >= maxAngle && !this.outOfRange) {
	        this.prevDay = this.seasonsState.day;
	        this.outOfRange = true;
	        this.seasonsState.day = SUMMER_SOLSTICE;
	        this.targetAngle = maxAngle;
	        this.phone.post('setSimState', { day: SUMMER_SOLSTICE, sunrayColor: SUNRAY_ERROR_COLOR });
	        return;
	      } else if (newAngle <= minAngle && !this.outOfRange) {
	        this.prevDay = this.seasonsState.day;
	        this.outOfRange = true;
	        this.seasonsState.day = WINTER_SOLSTICE;
	        this.targetAngle = minAngle;
	        this.phone.post('setSimState', { day: WINTER_SOLSTICE, sunrayColor: SUNRAY_ERROR_COLOR });
	        return;
	      } else if (newAngle >= maxAngle || newAngle <= minAngle) {
	        return;
	      }
	      this.outOfRange = false;
	      var newDay = this.angleToDay(newAngle);
	      var currentDay = this.seasonsState.day;
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
	      this.phone.post('setSimState', { day: newDay, sunrayColor: SUNRAY_HIGHLIGHT_COLOR });
	      this.seasonsState.day = newDay;
	      this.targetAngle = newAngle;
	    }

	    // WARNING: both functions are strictly related to logic in GRASP Seasons model.
	    // Reference functions:
	    // https://github.com/concord-consortium/grasp-seasons/blob/master/js/solar-system-data.js
	  }, {
	    key: 'sunrayAngle',
	    value: function sunrayAngle(day) {
	      // Angle of tilt axis, looked at from above (i.e., projected onto xy plane).
	      // June solstice = 0, September equinox = pi/2, December solstice = pi, March equinox = 3pi/2.
	      var tiltAxisZRadians = 2 * Math.PI * (day - SUMMER_SOLSTICE) / 365;
	      // How much is a given latitude tilted up (+) or down (-) toward the ecliptic?
	      // -23.5 degrees on June solstice, 0 degrees at equinoxes, +23.5 degrees on December solstice.
	      var orbitalTiltDegrees = this.seasonsState.earthTilt ? EARTH_TILT * RAD_2_DEG : 0;
	      var effectiveTiltDegrees = -Math.cos(tiltAxisZRadians) * orbitalTiltDegrees;
	      return 90 - (this.seasonsState.lat + effectiveTiltDegrees);
	    }
	  }, {
	    key: 'angleToDay',
	    value: function angleToDay(angle) {
	      // Inverse sunrayAngle function.
	      // If you write out math equation, you can convert sunrayAngle to formula below:
	      // angle = 90 - lat + Math.cos(2 * Math.PI * (day - SUMMER_SOLSTICE) / 365) * orbitalTiltDegrees
	      // (angle - 90 + lat) / orbitalTiltDegrees = Math.cos(2 * Math.PI * (day - SUMMER_SOLSTICE) / 365)
	      // Math.acos((angle - 90 + lat) / orbitalTiltDegrees)) = 2 * Math.PI * (day - SUMMER_SOLSTICE) / 365
	      // 365 * Math.acos((angle - 90 + lat) / orbitalTiltDegrees)) = 2 * Math.PI * (day - SUMMER_SOLSTICE)
	      // day - SUMMER_SOLSTICE = 365 * Math.acos((angle - 90 + lat) / orbitalTiltDegrees)) / (2 * Math.PI)
	      var orbitalTiltDegrees = this.seasonsState.earthTilt ? EARTH_TILT * RAD_2_DEG : 0;
	      var distFromSolstice = 365 * Math.acos((angle - 90 + this.seasonsState.lat) / orbitalTiltDegrees) / (2 * Math.PI);
	      if (isNaN(distFromSolstice)) {
	        return null;
	      }
	      var result = { day1: SUMMER_SOLSTICE - distFromSolstice, day2: SUMMER_SOLSTICE + distFromSolstice };
	      if (result.day1 < 0) result.day1 += 365;
	      return result;
	    }
	  }]);

	  return ModelController;
	})();

	module.exports = exports['default'];

/***/ },

/***/ 261:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(185)['default'];

	var _classCallCheck = __webpack_require__(188)['default'];

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var SunrayAngle = (function () {
	  function SunrayAngle(callback, plotter) {
	    _classCallCheck(this, SunrayAngle);

	    this.callback = callback;
	    this.plotter = plotter;
	  }

	  _createClass(SunrayAngle, [{
	    key: 'nextLeapState',
	    value: function nextLeapState(stateId, frame, data) {
	      var stateFuncName = 'state_' + stateId;
	      return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
	    }

	    // State definitions:

	  }, {
	    key: 'state_initial',
	    value: function state_initial(frame, data) {
	      if (frame.hands.length === 1) {
	        return 'oneHandDetected';
	      }
	      // Hide debug data.
	      this.plotter.showCanvas(null);
	      return null;
	    }
	  }, {
	    key: 'state_oneHandDetected',
	    value: function state_oneHandDetected(frame, data) {
	      var config = this.config;
	      var hand = frame.hands[0];
	      var angle = hand.roll() * 180 / Math.PI;
	      // Limit angle to [0, 180] range and do some conversions so it's matching angle provided by Seasons model.
	      if (hand.type === 'left') {
	        if (angle < 0 && angle > -90) {
	          angle = 0;
	        } else if (angle <= -90) {
	          angle = 180;
	        }
	      } else if (hand.type === 'right') {
	        angle += 180;
	        if (angle > 180 && angle < 270) {
	          angle = 180;
	        } else if (angle >= 270) {
	          angle = 0;
	        }
	      }
	      this.plotter.showCanvas('one-hand-detected');
	      this.plotter.plot('angle', angle);
	      this.plotter.update();

	      if (this.callback) {
	        this.callback(angle);
	      }
	      return null;
	    }
	  }]);

	  return SunrayAngle;
	})();

	exports['default'] = SunrayAngle;
	module.exports = exports['default'];

/***/ }

});