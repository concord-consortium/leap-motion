webpackJsonp([1],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(1)['default'];

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	var _reactDom = __webpack_require__(158);

	var _reactDom2 = _interopRequireDefault(_reactDom);

	var _componentsLabAddRmAtomTestSwipeJsx = __webpack_require__(245);

	var _componentsLabAddRmAtomTestSwipeJsx2 = _interopRequireDefault(_componentsLabAddRmAtomTestSwipeJsx);

	__webpack_require__(241);

	_reactDom2['default'].render(_react2['default'].createElement(_componentsLabAddRmAtomTestSwipeJsx2['default'], null), document.getElementById('app'));

/***/ },

/***/ 159:
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

	var _gesturesAddRmObj = __webpack_require__(219);

	var _gesturesAddRmObj2 = _interopRequireDefault(_gesturesAddRmObj);

	var _leapStandardInfoJsx = __webpack_require__(227);

	var _leapStandardInfoJsx2 = _interopRequireDefault(_leapStandardInfoJsx);

	var LabAddRmAtomTest = (function (_React$Component) {
	  _inherits(LabAddRmAtomTest, _React$Component);

	  function LabAddRmAtomTest(props) {
	    _classCallCheck(this, LabAddRmAtomTest);

	    _get(Object.getPrototypeOf(LabAddRmAtomTest.prototype), 'constructor', this).call(this, props);
	    this.state = {
	      objCount: 100,
	      objAdded: false,
	      objRemoved: false,
	      handType: null
	    };
	  }

	  _createClass(LabAddRmAtomTest, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.addRmObj = new _gesturesAddRmObj2['default'](this.props.addRmAtomConfig, this.gestureDetected.bind(this), this.plotter);
	    }
	  }, {
	    key: 'handleGestureConfigChange',
	    value: function handleGestureConfigChange(event) {
	      this.addRmObj.config[event.target.name] = event.target.value;
	    }
	  }, {
	    key: 'gestureDetected',
	    value: function gestureDetected(data) {
	      if (data.removed) {
	        this.setState({ objRemoved: true, objCount: this.state.objCount - 1, handType: data.handType });
	        setTimeout((function () {
	          this.setState({ objRemoved: false });
	        }).bind(this), 1500);
	      } else if (data.added) {
	        this.setState({ objAdded: true, objCount: this.state.objCount + 1, handType: data.handType });
	        setTimeout((function () {
	          this.setState({ objAdded: false });
	        }).bind(this), 1500);
	      }
	    }
	  }, {
	    key: 'nextLeapState',
	    value: function nextLeapState(stateId, frame, data) {
	      return this.addRmObj.nextLeapState(stateId, frame, data);
	    }
	  }, {
	    key: 'getStateMsg',
	    value: function getStateMsg() {
	      if (this.state.objRemoved) {
	        return _react2['default'].createElement(
	          'span',
	          { style: { color: 'red' } },
	          'Atom has been removed by ',
	          this.state.handType,
	          ' hand!'
	        );
	      } else if (this.state.objAdded) {
	        return _react2['default'].createElement(
	          'span',
	          { style: { color: 'green' } },
	          'Atom has been added by ',
	          this.state.handType,
	          ' hand!'
	        );
	      }
	      switch (this.state.leapState) {
	        case 'initial':
	          return 'Please keep you hand (left or right) steady above the Leap device.';
	        case 'oneHandDetected':
	          return _react2['default'].createElement(
	            'div',
	            null,
	            _react2['default'].createElement(
	              'p',
	              null,
	              'Close your hand, move it ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'up'
	              ),
	              ' and open to ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'remove'
	              ),
	              ' an atom.'
	            ),
	            _react2['default'].createElement(
	              'p',
	              null,
	              'Close your hand, move it ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'down'
	              ),
	              ' and open to ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'add'
	              ),
	              ' an atom.'
	            )
	          );
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return _react2['default'].createElement(
	        'div',
	        null,
	        _react2['default'].createElement(
	          'h2',
	          null,
	          'Number of atoms: ',
	          this.state.objCount
	        ),
	        _react2['default'].createElement(_leapStandardInfoJsx2['default'], { ref: 'leapInfo', stateMsg: this.getStateMsg() }),
	        _react2['default'].createElement(
	          'p',
	          null,
	          'Closed hand grab strength [0, 1]: ',
	          _react2['default'].createElement('input', { type: 'text', name: 'closedGrabStrength',
	            defaultValue: this.props.addRmAtomConfig.closedGrabStrength,
	            onChange: this.handleGestureConfigChange.bind(this) })
	        )
	      );
	    }
	  }, {
	    key: 'plotter',
	    get: function get() {
	      return this.refs.leapInfo.plotter;
	    }
	  }]);

	  return LabAddRmAtomTest;
	})(_react2['default'].Component);

	exports['default'] = LabAddRmAtomTest;

	LabAddRmAtomTest.defaultProps = {
	  addRmAtomConfig: {
	    closedGrabStrength: 0.8,
	    minAmplitude: 50, // mm
	    maxTime: 2000 // ms
	  }
	};

	_reactMixin2['default'].onClass(LabAddRmAtomTest, _mixinsLeapStateHandling2['default']);
	module.exports = exports['default'];

/***/ },

/***/ 219:
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

	var AddRmObj = (function () {
	  function AddRmObj(config, callback, plotter) {
	    _classCallCheck(this, AddRmObj);

	    this.config = config;
	    this.callback = callback;
	    this.plotter = plotter;
	    // State
	    this.initialPos = null;
	    this.initialTime = null;
	    this.isClosed = false;

	    this.addSound = new _howler.Howl({
	      urls: ['add.wav']
	    });
	    this.rmSound = new _howler.Howl({
	      urls: ['remove.wav']
	    });
	  }

	  _createClass(AddRmObj, [{
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
	      if (hand.grabStrength > config.closedGrabStrength) {
	        // Closed hand.
	        if (!this.isClosed) {
	          this.initialPos = hand.stabilizedPalmPosition[1];
	          this.initialTime = Date.now();
	          this.isClosed = true;
	        }
	      } else {
	        // Open hand.
	        var posDelta = hand.stabilizedPalmPosition[1] - this.initialPos;
	        var timeDelta = Date.now() - this.initialTime;
	        if (this.isClosed && timeDelta < config.maxTime && posDelta > config.minAmplitude) {
	          this.rmSound.play();
	          this.callback({ removed: true, handType: hand.type });
	        } else if (this.isClosed && timeDelta < config.maxTime && posDelta < -config.minAmplitude) {
	          this.addSound.play();
	          this.callback({ added: true, handType: hand.type });
	        }
	        this.isClosed = false;
	        this.initialPos = null;
	      }
	      this.plotter.showCanvas('one-hand-detected');
	      this.plotter.plot('grab strength', hand.grabStrength);
	      this.plotter.plot('hand Y pos', hand.stabilizedPalmPosition[1]);
	      this.plotter.update();
	      return null;
	    }
	  }]);

	  return AddRmObj;
	})();

	exports['default'] = AddRmObj;
	module.exports = exports['default'];

/***/ },

/***/ 245:
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

	var _labAddRmAtomTestJsx = __webpack_require__(159);

	var _labAddRmAtomTestJsx2 = _interopRequireDefault(_labAddRmAtomTestJsx);

	var _leapStandardInfoJsx = __webpack_require__(227);

	var _leapStandardInfoJsx2 = _interopRequireDefault(_leapStandardInfoJsx);

	var _gesturesAddRmObjSwipe = __webpack_require__(246);

	var _gesturesAddRmObjSwipe2 = _interopRequireDefault(_gesturesAddRmObjSwipe);

	var LabAddRmAtomTestSwipe = (function (_LabAddRmAtomTest) {
	  _inherits(LabAddRmAtomTestSwipe, _LabAddRmAtomTest);

	  function LabAddRmAtomTestSwipe() {
	    _classCallCheck(this, LabAddRmAtomTestSwipe);

	    _get(Object.getPrototypeOf(LabAddRmAtomTestSwipe.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(LabAddRmAtomTestSwipe, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.addRmObj = new _gesturesAddRmObjSwipe2['default'](this.props.addRmAtomConfig, this.gestureDetected.bind(this), this.plotter);
	      this.leapConnect(); // we need to call it manually, as we overwrite method modified by react mixin
	    }
	  }, {
	    key: 'getStateMsg',
	    value: function getStateMsg() {
	      if (this.state.objRemoved) {
	        return _react2['default'].createElement(
	          'span',
	          { style: { color: 'red' } },
	          'Atom has been removed by ',
	          this.state.handType,
	          ' hand!'
	        );
	      } else if (this.state.objAdded) {
	        return _react2['default'].createElement(
	          'span',
	          { style: { color: 'green' } },
	          'Atom has been added by ',
	          this.state.handType,
	          ' hand!'
	        );
	      }
	      switch (this.state.leapState) {
	        case 'initial':
	          return 'Please keep you hand (left or right) steady above the Leap device.';
	        case 'oneHandDetected':
	          return _react2['default'].createElement(
	            'div',
	            null,
	            _react2['default'].createElement(
	              'p',
	              null,
	              'Sweep ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'in'
	              ),
	              ' to ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'add'
	              ),
	              ' an atom.'
	            ),
	            _react2['default'].createElement(
	              'p',
	              null,
	              'Sweep ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'out'
	              ),
	              ' to ',
	              _react2['default'].createElement(
	                'b',
	                null,
	                'remove'
	              ),
	              ' an atom.'
	            )
	          );
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return _react2['default'].createElement(
	        'div',
	        null,
	        _react2['default'].createElement(
	          'h2',
	          null,
	          'Number of atoms: ',
	          this.state.objCount
	        ),
	        _react2['default'].createElement(_leapStandardInfoJsx2['default'], { ref: 'leapInfo', stateMsg: this.getStateMsg() }),
	        _react2['default'].createElement(
	          'p',
	          null,
	          'Sweep max time [ms]: ',
	          _react2['default'].createElement('input', { type: 'text', name: 'maxTime',
	            defaultValue: this.props.addRmAtomConfig.maxTime,
	            onChange: this.handleGestureConfigChange.bind(this) })
	        ),
	        _react2['default'].createElement(
	          'p',
	          null,
	          'Sweep min amplitude: ',
	          _react2['default'].createElement('input', { type: 'text', name: 'minAmplitude',
	            defaultValue: this.props.addRmAtomConfig.minAmplitude,
	            onChange: this.handleGestureConfigChange.bind(this) })
	        )
	      );
	    }
	  }]);

	  return LabAddRmAtomTestSwipe;
	})(_labAddRmAtomTestJsx2['default']);

	exports['default'] = LabAddRmAtomTestSwipe;

	_labAddRmAtomTestJsx2['default'].defaultProps = {
	  addRmAtomConfig: {
	    bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
	    minAmplitude: 1,
	    maxTime: 110 // ms
	  }
	};
	module.exports = exports['default'];

/***/ },

/***/ 246:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(185)['default'];

	var _classCallCheck = __webpack_require__(188)['default'];

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _howler = __webpack_require__(220);

	var DEFAULT_OPTIONS = {
	  bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
	  minAmplitude: 1,
	  maxTime: 110 // ms
	};

	var AddRmObjSwipe = (function () {
	  function AddRmObjSwipe(config, callback, plotter) {
	    _classCallCheck(this, AddRmObjSwipe);

	    this.config = config || DEFAULT_OPTIONS;
	    this.callback = callback;
	    this.plotter = plotter;

	    this.addSound = new _howler.Howl({
	      urls: ['add.wav']
	    });
	    this.rmSound = new _howler.Howl({
	      urls: ['remove.wav']
	    });

	    this._yaw = [];
	    this._t = [];
	  }

	  _createClass(AddRmObjSwipe, [{
	    key: 'nextLeapState',
	    value: function nextLeapState(stateId, frame, data) {
	      var stateFuncName = 'state_' + stateId;
	      return this[stateFuncName] ? this[stateFuncName](frame, data) : null;
	    }
	  }, {
	    key: '_addSample',
	    value: function _addSample(yaw, handType) {
	      this._yaw.unshift(yaw);
	      this._t.unshift(performance.now());
	      if (this._yaw.length > this.config.bufferLength) {
	        this._yaw.length = this.config.bufferLength;
	        this._t.length = this.config.bufferLength;
	      }
	      this._check(handType);
	    }
	  }, {
	    key: '_check',
	    value: function _check(handType) {
	      var d = this._yaw;
	      var len = this._yaw.length;
	      for (var i = 0; i < len - 1; i++) {
	        if (this._checkLeftSwipe(i)) {
	          var data = {
	            handType: handType
	          };
	          if (handType === 'right') {
	            data.added = true;
	            this.addSound.play();
	          } else {
	            data.removed = true;
	            this.rmSound.play();
	          }
	          this.callback(data);
	          this._clearBuffers();
	          return;
	        } else if (this._checkRightSwipe(i)) {
	          var data = {
	            handType: handType
	          };
	          if (handType === 'left') {
	            data.added = true;
	            this.addSound.play();
	          } else {
	            data.removed = true;
	            this.rmSound.play();
	          }
	          this.callback(data);
	          this._clearBuffers();
	          return;
	        }
	      }
	    }
	  }, {
	    key: '_checkLeftSwipe',
	    value: function _checkLeftSwipe(startIdx) {
	      var d = this._yaw;
	      var t = this._t;
	      var len = this._yaw.length;
	      for (var i = startIdx; i < len - 1; i++) {
	        if (d[i] > d[i + 1]) {
	          return false;
	        }
	        if (t[startIdx] - t[i + 1] > this.config.maxTime) {
	          return false;
	        }
	        if (d[i + 1] - d[startIdx] > this.config.minAmplitude) {
	          return true;
	        }
	      }
	      return false;
	    }
	  }, {
	    key: '_checkRightSwipe',
	    value: function _checkRightSwipe(startIdx) {
	      var d = this._yaw;
	      var t = this._t;
	      var len = this._yaw.length;
	      for (var i = startIdx; i < len - 1; i++) {
	        if (d[i] < d[i + 1]) {
	          return false;
	        }
	        if (t[startIdx] - t[i + 1] > this.config.maxTime) {
	          return false;
	        }
	        if (d[startIdx] - d[i + 1] > this.config.minAmplitude) {
	          return true;
	        }
	      }
	      return false;
	    }
	  }, {
	    key: '_clearBuffers',
	    value: function _clearBuffers() {
	      this._yaw.length = 0;
	      this._t.length = 0;
	    }

	    // State definitions:

	  }, {
	    key: 'state_initial',
	    value: function state_initial(frame, data) {
	      if (frame.hands.length === 1) {
	        return 'oneHandDetected';
	      }
	      return null;
	    }
	  }, {
	    key: 'state_oneHandDetected',
	    value: function state_oneHandDetected(frame, data) {
	      var hand = frame.hands[0];
	      var yaw = hand.yaw();
	      this._addSample(yaw, hand.type);
	      this.plotter.showCanvas('one-hand-detected');
	      this.plotter.plot('yaw', yaw);
	      this.plotter.update();
	      return null;
	    }
	  }]);

	  return AddRmObjSwipe;
	})();

	exports['default'] = AddRmObjSwipe;
	module.exports = exports['default'];

/***/ }

});