webpackJsonp([4],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(1)['default'];

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	var _reactDom = __webpack_require__(158);

	var _reactDom2 = _interopRequireDefault(_reactDom);

	var _componentsLabTemperatureDeltaJsx = __webpack_require__(255);

	var _componentsLabTemperatureDeltaJsx2 = _interopRequireDefault(_componentsLabTemperatureDeltaJsx);

	__webpack_require__(241);

	_reactDom2['default'].render(_react2['default'].createElement(_componentsLabTemperatureDeltaJsx2['default'], null), document.getElementById('app'));

/***/ },

/***/ 248:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(185)['default'];

	var _classCallCheck = __webpack_require__(188)['default'];

	var _interopRequireDefault = __webpack_require__(1)['default'];

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _toolsAvg = __webpack_require__(218);

	var _toolsAvg2 = _interopRequireDefault(_toolsAvg);

	var _howler = __webpack_require__(220);

	var _toolsDirectionChange = __webpack_require__(221);

	var _toolsDirectionChange2 = _interopRequireDefault(_toolsDirectionChange);

	var FistBump = (function () {
	  function FistBump(config, callback, plotter) {
	    _classCallCheck(this, FistBump);

	    this.config = config;
	    this.callback = callback;
	    this.plotter = plotter;
	    // Outputs:
	    this.freq = 0;
	    this.maxVel = 0;
	    this.hand = null;
	    this._setupDirectionChangeAlg();
	  }

	  _createClass(FistBump, [{
	    key: '_setupDirectionChangeAlg',
	    value: function _setupDirectionChangeAlg() {
	      var lastDirChange = null;
	      var sound = new _howler.Howl({
	        urls: ['tap.wav']
	      });
	      this.freqCalc = new _toolsDirectionChange2['default']({
	        minAmplitude: this.config.minAmplitude,
	        onDirChange: (function (data) {
	          var timestamp = Date.now();
	          if (lastDirChange) {
	            this.freq = 0.5 * 1000 / (timestamp - lastDirChange);
	            this.maxVel = data.maxVelocity;
	          }
	          lastDirChange = timestamp;
	          if (this.hand && (this.hand.type === 'right' && data.type === _toolsDirectionChange2['default'].LEFT_TO_RIGHT || this.hand.type === 'left' && data.type === _toolsDirectionChange2['default'].RIGHT_TO_LEFT)) {
	            // Sound effect!
	            sound.play();
	          }
	        }).bind(this),
	        onStop: (function () {
	          lastDirChange = Date.now();
	          this.freq = 0;
	          this.maxVel = 0;
	        }).bind(this)
	      });
	    }
	  }, {
	    key: 'nextLeapState',
	    value: function nextLeapState(stateId, frame, data) {
	      var stateFuncName = 'state_' + stateId;
	      return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
	    }

	    // State definitions:

	  }, {
	    key: 'state_initial',
	    value: function state_initial(frame, data) {
	      if (frame.hands.length === 2) {
	        return 'twoHandsDetected';
	      }
	      // Hide debug data.
	      this.plotter.showCanvas(null);
	      return null;
	    }
	  }, {
	    key: 'state_twoHandsDetected',
	    value: function state_twoHandsDetected(frame, data) {
	      var config = this.config;
	      function condition(closedHandIdx, openHandIdx) {
	        var closedHand = frame.hands[closedHandIdx];
	        var openHand = frame.hands[openHandIdx];
	        if (closedHand.grabStrength > config.closedGrabStrength && openHand.grabStrength < config.openGrabStrength && Math.abs(Math.abs(openHand.roll()) - Math.PI / 2) < config.handTwistTolerance) {
	          return true;
	        }
	        return false;
	      }
	      if (condition(0, 1)) {
	        return { stateId: 'gestureDetected', data: { closedHand: frame.hands[0], openHand: frame.hands[1] } };
	      } else if (condition(1, 0)) {
	        return { stateId: 'gestureDetected', data: { closedHand: frame.hands[1], openHand: frame.hands[0] } };
	      } else {
	        this.plotter.showCanvas('two-hands-detected');
	        this.plotter.plot('hand 0 roll', frame.hands[0].roll());
	        this.plotter.plot('hand 1 grab strength', frame.hands[1].grabStrength);
	        this.plotter.update();
	        return null;
	      }
	    }
	  }, {
	    key: 'state_gestureDetected',
	    value: function state_gestureDetected(frame, data) {
	      this.hand = data.closedHand;
	      _toolsAvg2['default'].addSample('fistXVel', this.hand.palmVelocity[0], 6);
	      this.freqCalc.addSample(_toolsAvg2['default'].getAvg('fistXVel'), this.hand.palmPosition[0]);
	      this.callback();
	      return null;
	    }
	  }]);

	  return FistBump;
	})();

	exports['default'] = FistBump;
	module.exports = exports['default'];

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

/***/ 255:
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

	var _mixinsLeapStateHandling = __webpack_require__(192);

	var _mixinsLeapStateHandling2 = _interopRequireDefault(_mixinsLeapStateHandling);

	var _gesturesFistBump = __webpack_require__(248);

	var _gesturesFistBump2 = _interopRequireDefault(_gesturesFistBump);

	var _toolsAvg = __webpack_require__(218);

	var _toolsAvg2 = _interopRequireDefault(_toolsAvg);

	var _iframePhone = __webpack_require__(249);

	var _iframePhone2 = _interopRequireDefault(_iframePhone);

	var _leapStandardInfoJsx = __webpack_require__(227);

	var _leapStandardInfoJsx2 = _interopRequireDefault(_leapStandardInfoJsx);

	var LabTemperatureDelta = (function (_React$Component) {
	  _inherits(LabTemperatureDelta, _React$Component);

	  function LabTemperatureDelta(props) {
	    _classCallCheck(this, LabTemperatureDelta);

	    _get(Object.getPrototypeOf(LabTemperatureDelta.prototype), 'constructor', this).call(this, props);
	    this.state = {
	      tempChange: 'none'
	    };
	  }

	  _createClass(LabTemperatureDelta, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.fistBump = new _gesturesFistBump2['default'](this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
	      this.setupLabCommunication();
	    }
	  }, {
	    key: 'setupLabCommunication',
	    value: function setupLabCommunication() {
	      // Leap works only when window is active.
	      // We can easily loose focus when when user interacts with Lab model.
	      setInterval(function () {
	        window.focus();
	      }, 500);

	      this.labTemperature = null;
	      this.labPhone = new _iframePhone2['default'].ParentEndpoint(this.refs.labModel);

	      this.labPhone.addListener('modelLoaded', (function () {
	        this.labPhone.post('play');
	        this.labPhone.post('observe', 'targetTemperature');
	      }).bind(this));

	      this.labPhone.addListener('propertyValue', (function (data) {
	        if (data.name == 'targetTemperature') {
	          this.labTemperature = data.value;
	        }
	      }).bind(this));
	    }
	  }, {
	    key: 'gestureDetected',
	    value: function gestureDetected() {
	      _toolsAvg2['default'].addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
	      var maxVelAvg = _toolsAvg2['default'].getAvg('maxVel');
	      var newTemp = null;
	      if (maxVelAvg > this.props.tempIncreaseVel) {
	        newTemp = Math.min(5000, this.labTemperature + 10);
	        this.setState({ tempChange: 'increasing' });
	      } else if (maxVelAvg < this.props.tempDecreaseVel) {
	        newTemp = Math.max(0, this.labTemperature - 10);
	        this.setState({ tempChange: 'decreasing' });
	      } else {
	        this.setState({ tempChange: 'none' });
	      }
	      if (newTemp) {
	        this.labPhone.post('set', { name: 'targetTemperature', value: newTemp });
	      }
	      this.plotter.showCanvas('gesture-detected');
	      this.plotter.plot('max velocity avg', maxVelAvg, { min: 0, max: 1500, precision: 2 });
	      this.plotter.update();
	    }
	  }, {
	    key: 'nextLeapState',
	    value: function nextLeapState(stateId, frame, data) {
	      return this.fistBump.nextLeapState(stateId, frame, data);
	    }
	  }, {
	    key: 'getStateMsg',
	    value: function getStateMsg() {
	      switch (this.state.leapState) {
	        case 'initial':
	          return 'Please keep your hands steady above the Leap device.';
	        case 'twoHandsDetected':
	          return 'Close one fist and twist the other hand.';
	        case 'gestureDetected':
	          if (this.state.tempChange === 'none') return _react2['default'].createElement(
	            'p',
	            null,
	            'Move your closed fist towards open palm and back rapidly to increase the temperature (velocity > ',
	            Math.round(this.props.tempIncreaseVel),
	            '). Do it slowly to decrease the temperature (velocity < ',
	            Math.round(this.props.tempDecreaseVel),
	            ').'
	          );
	          if (this.state.tempChange === 'increasing') return 'Temperature is increasing (velocity > ' + Math.round(this.props.tempIncreaseVel) + ').';
	          if (this.state.tempChange === 'decreasing') return 'Temperature is decreasing (velocity < ' + Math.round(this.props.tempDecreaseVel) + ').';
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return _react2['default'].createElement(
	        'div',
	        null,
	        _react2['default'].createElement(
	          'div',
	          null,
	          _react2['default'].createElement('iframe', { ref: 'labModel', width: '610px', height: '350px', frameBorder: '0', src: 'http://lab.concord.org/embeddable.html#interactives/grasp/temperature-pressure-relationship.json' })
	        ),
	        _react2['default'].createElement(_leapStandardInfoJsx2['default'], { ref: 'leapInfo', stateMsg: this.getStateMsg() })
	      );
	    }
	  }, {
	    key: 'plotter',
	    get: function get() {
	      return this.refs.leapInfo.plotter;
	    }
	  }]);

	  return LabTemperatureDelta;
	})(_react2['default'].Component);

	exports['default'] = LabTemperatureDelta;

	LabTemperatureDelta.defaultProps = {
	  tempIncreaseVel: 600,
	  tempDecreaseVel: 400,
	  maxVelAvg: 120,
	  handBumpConfig: {
	    closedGrabStrength: 0.4,
	    openGrabStrength: 0.7,
	    handTwistTolerance: 0.7,
	    minAmplitude: 5
	  }
	};

	_reactMixin2['default'].onClass(LabTemperatureDelta, _mixinsLeapStateHandling2['default']);
	module.exports = exports['default'];

/***/ }

});