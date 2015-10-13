webpackJsonp([5],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(1)['default'];

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	var _reactDom = __webpack_require__(158);

	var _reactDom2 = _interopRequireDefault(_reactDom);

	var _componentsLabTemperatureTestJsx = __webpack_require__(256);

	var _componentsLabTemperatureTestJsx2 = _interopRequireDefault(_componentsLabTemperatureTestJsx);

	__webpack_require__(241);

	_reactDom2['default'].render(_react2['default'].createElement(_componentsLabTemperatureTestJsx2['default'], null), document.getElementById('app'));

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

/***/ 256:
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

	var _toolsAvg = __webpack_require__(218);

	var _toolsAvg2 = _interopRequireDefault(_toolsAvg);

	var _gesturesFistBump = __webpack_require__(248);

	var _gesturesFistBump2 = _interopRequireDefault(_gesturesFistBump);

	var _leapStandardInfoJsx = __webpack_require__(227);

	var _leapStandardInfoJsx2 = _interopRequireDefault(_leapStandardInfoJsx);

	var LabTemperatureTest = (function (_React$Component) {
	  _inherits(LabTemperatureTest, _React$Component);

	  function LabTemperatureTest() {
	    _classCallCheck(this, LabTemperatureTest);

	    _get(Object.getPrototypeOf(LabTemperatureTest.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(LabTemperatureTest, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.fistBump = new _gesturesFistBump2['default'](this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
	    }
	  }, {
	    key: 'gestureDetected',
	    value: function gestureDetected() {
	      _toolsAvg2['default'].addSample('newFreq', this.fistBump.freq, Math.round(this.props.freqAvg));
	      _toolsAvg2['default'].addSample('maxVel', this.fistBump.maxVel, Math.round(this.props.maxVelAvg));
	      this.plotter.showCanvas('gesture-detected');
	      this.plotter.plot('max velocity avg', _toolsAvg2['default'].getAvg('maxVel'), { min: 0, max: 1500, precision: 2 });
	      this.plotter.plot('frequency', _toolsAvg2['default'].getAvg('newFreq'), { min: 0, max: 6, precision: 2 });
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
	          return 'Move your closed fist towards open palm and back rapidly.';
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return _react2['default'].createElement(_leapStandardInfoJsx2['default'], { ref: 'leapInfo', stateMsg: this.getStateMsg() });
	    }
	  }, {
	    key: 'plotter',
	    get: function get() {
	      return this.refs.leapInfo.plotter;
	    }
	  }]);

	  return LabTemperatureTest;
	})(_react2['default'].Component);

	exports['default'] = LabTemperatureTest;

	LabTemperatureTest.defaultProps = {
	  maxVelAvg: 120,
	  freqAvg: 120,
	  handBumpConfig: {
	    closedGrabStrength: 0.4,
	    openGrabStrength: 0.7,
	    handTwistTolerance: 0.7,
	    minAmplitude: 5
	  }
	};

	_reactMixin2['default'].onClass(LabTemperatureTest, _mixinsLeapStateHandling2['default']);
	module.exports = exports['default'];

/***/ }

});