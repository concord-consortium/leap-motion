webpackJsonp([7],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(1)['default'];

	var _react = __webpack_require__(2);

	var _react2 = _interopRequireDefault(_react);

	var _reactDom = __webpack_require__(158);

	var _reactDom2 = _interopRequireDefault(_reactDom);

	var _componentsLabVolumePressureJsx = __webpack_require__(259);

	var _componentsLabVolumePressureJsx2 = _interopRequireDefault(_componentsLabVolumePressureJsx);

	__webpack_require__(241);

	_reactDom2['default'].render(_react2['default'].createElement(_componentsLabVolumePressureJsx2['default'], null), document.getElementById('app'));

/***/ },

/***/ 220:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 *  howler.js v1.1.26
	 *  howlerjs.com
	 *
	 *  (c) 2013-2015, James Simpson of GoldFire Studios
	 *  goldfirestudios.com
	 *
	 *  MIT License
	 */

	(function() {
	  // setup
	  var cache = {};

	  // setup the audio context
	  var ctx = null,
	    usingWebAudio = true,
	    noAudio = false;
	  try {
	    if (typeof AudioContext !== 'undefined') {
	      ctx = new AudioContext();
	    } else if (typeof webkitAudioContext !== 'undefined') {
	      ctx = new webkitAudioContext();
	    } else {
	      usingWebAudio = false;
	    }
	  } catch(e) {
	    usingWebAudio = false;
	  }

	  if (!usingWebAudio) {
	    if (typeof Audio !== 'undefined') {
	      try {
	        new Audio();
	      } catch(e) {
	        noAudio = true;
	      }
	    } else {
	      noAudio = true;
	    }
	  }

	  // create a master gain node
	  if (usingWebAudio) {
	    var masterGain = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
	    masterGain.gain.value = 1;
	    masterGain.connect(ctx.destination);
	  }

	  // create global controller
	  var HowlerGlobal = function(codecs) {
	    this._volume = 1;
	    this._muted = false;
	    this.usingWebAudio = usingWebAudio;
	    this.ctx = ctx;
	    this.noAudio = noAudio;
	    this._howls = [];
	    this._codecs = codecs;
	    this.iOSAutoEnable = true;
	  };
	  HowlerGlobal.prototype = {
	    /**
	     * Get/set the global volume for all sounds.
	     * @param  {Float} vol Volume from 0.0 to 1.0.
	     * @return {Howler/Float}     Returns self or current volume.
	     */
	    volume: function(vol) {
	      var self = this;

	      // make sure volume is a number
	      vol = parseFloat(vol);

	      if (vol >= 0 && vol <= 1) {
	        self._volume = vol;

	        if (usingWebAudio) {
	          masterGain.gain.value = vol;
	        }

	        // loop through cache and change volume of all nodes that are using HTML5 Audio
	        for (var key in self._howls) {
	          if (self._howls.hasOwnProperty(key) && self._howls[key]._webAudio === false) {
	            // loop through the audio nodes
	            for (var i=0; i<self._howls[key]._audioNode.length; i++) {
	              self._howls[key]._audioNode[i].volume = self._howls[key]._volume * self._volume;
	            }
	          }
	        }

	        return self;
	      }

	      // return the current global volume
	      return (usingWebAudio) ? masterGain.gain.value : self._volume;
	    },

	    /**
	     * Mute all sounds.
	     * @return {Howler}
	     */
	    mute: function() {
	      this._setMuted(true);

	      return this;
	    },

	    /**
	     * Unmute all sounds.
	     * @return {Howler}
	     */
	    unmute: function() {
	      this._setMuted(false);

	      return this;
	    },

	    /**
	     * Handle muting and unmuting globally.
	     * @param  {Boolean} muted Is muted or not.
	     */
	    _setMuted: function(muted) {
	      var self = this;

	      self._muted = muted;

	      if (usingWebAudio) {
	        masterGain.gain.value = muted ? 0 : self._volume;
	      }

	      for (var key in self._howls) {
	        if (self._howls.hasOwnProperty(key) && self._howls[key]._webAudio === false) {
	          // loop through the audio nodes
	          for (var i=0; i<self._howls[key]._audioNode.length; i++) {
	            self._howls[key]._audioNode[i].muted = muted;
	          }
	        }
	      }
	    },

	    /**
	     * Check for codec support.
	     * @param  {String} ext Audio file extention.
	     * @return {Boolean}
	     */
	    codecs: function(ext) {
	      return this._codecs[ext];
	    },

	    /**
	     * iOS will only allow audio to be played after a user interaction.
	     * Attempt to automatically unlock audio on the first user interaction.
	     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
	     * @return {Howler}
	     */
	    _enableiOSAudio: function() {
	      var self = this;

	      // only run this on iOS if audio isn't already eanbled
	      if (ctx && (self._iOSEnabled || !/iPhone|iPad|iPod/i.test(navigator.userAgent))) {
	        return;
	      }

	      self._iOSEnabled = false;

	      // call this method on touch start to create and play a buffer,
	      // then check if the audio actually played to determine if
	      // audio has now been unlocked on iOS
	      var unlock = function() {
	        // create an empty buffer
	        var buffer = ctx.createBuffer(1, 1, 22050);
	        var source = ctx.createBufferSource();
	        source.buffer = buffer;
	        source.connect(ctx.destination);

	        // play the empty buffer
	        if (typeof source.start === 'undefined') {
	          source.noteOn(0);
	        } else {
	          source.start(0);
	        }

	        // setup a timeout to check that we are unlocked on the next event loop
	        setTimeout(function() {
	          if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
	            // update the unlocked state and prevent this check from happening again
	            self._iOSEnabled = true;
	            self.iOSAutoEnable = false;

	            // remove the touch start listener
	            window.removeEventListener('touchstart', unlock, false);
	          }
	        }, 0);
	      };

	      // setup a touch start listener to attempt an unlock in
	      window.addEventListener('touchstart', unlock, false);

	      return self;
	    }
	  };

	  // check for browser codec support
	  var audioTest = null;
	  var codecs = {};
	  if (!noAudio) {
	    audioTest = new Audio();
	    codecs = {
	      mp3: !!audioTest.canPlayType('audio/mpeg;').replace(/^no$/, ''),
	      opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
	      ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
	      wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
	      aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
	      m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
	      mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
	      weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
	    };
	  }

	  // allow access to the global audio controls
	  var Howler = new HowlerGlobal(codecs);

	  // setup the audio object
	  var Howl = function(o) {
	    var self = this;

	    // setup the defaults
	    self._autoplay = o.autoplay || false;
	    self._buffer = o.buffer || false;
	    self._duration = o.duration || 0;
	    self._format = o.format || null;
	    self._loop = o.loop || false;
	    self._loaded = false;
	    self._sprite = o.sprite || {};
	    self._src = o.src || '';
	    self._pos3d = o.pos3d || [0, 0, -0.5];
	    self._volume = o.volume !== undefined ? o.volume : 1;
	    self._urls = o.urls || [];
	    self._rate = o.rate || 1;

	    // allow forcing of a specific panningModel ('equalpower' or 'HRTF'),
	    // if none is specified, defaults to 'equalpower' and switches to 'HRTF'
	    // if 3d sound is used
	    self._model = o.model || null;

	    // setup event functions
	    self._onload = [o.onload || function() {}];
	    self._onloaderror = [o.onloaderror || function() {}];
	    self._onend = [o.onend || function() {}];
	    self._onpause = [o.onpause || function() {}];
	    self._onplay = [o.onplay || function() {}];

	    self._onendTimer = [];

	    // Web Audio or HTML5 Audio?
	    self._webAudio = usingWebAudio && !self._buffer;

	    // check if we need to fall back to HTML5 Audio
	    self._audioNode = [];
	    if (self._webAudio) {
	      self._setupAudioNode();
	    }

	    // automatically try to enable audio on iOS
	    if (typeof ctx !== 'undefined' && ctx && Howler.iOSAutoEnable) {
	      Howler._enableiOSAudio();
	    }

	    // add this to an array of Howl's to allow global control
	    Howler._howls.push(self);

	    // load the track
	    self.load();
	  };

	  // setup all of the methods
	  Howl.prototype = {
	    /**
	     * Load an audio file.
	     * @return {Howl}
	     */
	    load: function() {
	      var self = this,
	        url = null;

	      // if no audio is available, quit immediately
	      if (noAudio) {
	        self.on('loaderror');
	        return;
	      }

	      // loop through source URLs and pick the first one that is compatible
	      for (var i=0; i<self._urls.length; i++) {
	        var ext, urlItem;

	        if (self._format) {
	          // use specified audio format if available
	          ext = self._format;
	        } else {
	          // figure out the filetype (whether an extension or base64 data)
	          urlItem = self._urls[i];
	          ext = /^data:audio\/([^;,]+);/i.exec(urlItem);
	          if (!ext) {
	            ext = /\.([^.]+)$/.exec(urlItem.split('?', 1)[0]);
	          }

	          if (ext) {
	            ext = ext[1].toLowerCase();
	          } else {
	            self.on('loaderror');
	            return;
	          }
	        }

	        if (codecs[ext]) {
	          url = self._urls[i];
	          break;
	        }
	      }

	      if (!url) {
	        self.on('loaderror');
	        return;
	      }

	      self._src = url;

	      if (self._webAudio) {
	        loadBuffer(self, url);
	      } else {
	        var newNode = new Audio();

	        // listen for errors with HTML5 audio (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror)
	        newNode.addEventListener('error', function () {
	          if (newNode.error && newNode.error.code === 4) {
	            HowlerGlobal.noAudio = true;
	          }

	          self.on('loaderror', {type: newNode.error ? newNode.error.code : 0});
	        }, false);

	        self._audioNode.push(newNode);

	        // setup the new audio node
	        newNode.src = url;
	        newNode._pos = 0;
	        newNode.preload = 'auto';
	        newNode.volume = (Howler._muted) ? 0 : self._volume * Howler.volume();

	        // setup the event listener to start playing the sound
	        // as soon as it has buffered enough
	        var listener = function() {
	          // round up the duration when using HTML5 Audio to account for the lower precision
	          self._duration = Math.ceil(newNode.duration * 10) / 10;

	          // setup a sprite if none is defined
	          if (Object.getOwnPropertyNames(self._sprite).length === 0) {
	            self._sprite = {_default: [0, self._duration * 1000]};
	          }

	          if (!self._loaded) {
	            self._loaded = true;
	            self.on('load');
	          }

	          if (self._autoplay) {
	            self.play();
	          }

	          // clear the event listener
	          newNode.removeEventListener('canplaythrough', listener, false);
	        };
	        newNode.addEventListener('canplaythrough', listener, false);
	        newNode.load();
	      }

	      return self;
	    },

	    /**
	     * Get/set the URLs to be pulled from to play in this source.
	     * @param  {Array} urls  Arry of URLs to load from
	     * @return {Howl}        Returns self or the current URLs
	     */
	    urls: function(urls) {
	      var self = this;

	      if (urls) {
	        self.stop();
	        self._urls = (typeof urls === 'string') ? [urls] : urls;
	        self._loaded = false;
	        self.load();

	        return self;
	      } else {
	        return self._urls;
	      }
	    },

	    /**
	     * Play a sound from the current time (0 by default).
	     * @param  {String}   sprite   (optional) Plays from the specified position in the sound sprite definition.
	     * @param  {Function} callback (optional) Returns the unique playback id for this sound instance.
	     * @return {Howl}
	     */
	    play: function(sprite, callback) {
	      var self = this;

	      // if no sprite was passed but a callback was, update the variables
	      if (typeof sprite === 'function') {
	        callback = sprite;
	      }

	      // use the default sprite if none is passed
	      if (!sprite || typeof sprite === 'function') {
	        sprite = '_default';
	      }

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('load', function() {
	          self.play(sprite, callback);
	        });

	        return self;
	      }

	      // if the sprite doesn't exist, play nothing
	      if (!self._sprite[sprite]) {
	        if (typeof callback === 'function') callback();
	        return self;
	      }

	      // get the node to playback
	      self._inactiveNode(function(node) {
	        // persist the sprite being played
	        node._sprite = sprite;

	        // determine where to start playing from
	        var pos = (node._pos > 0) ? node._pos : self._sprite[sprite][0] / 1000;

	        // determine how long to play for
	        var duration = 0;
	        if (self._webAudio) {
	          duration = self._sprite[sprite][1] / 1000 - node._pos;
	          if (node._pos > 0) {
	            pos = self._sprite[sprite][0] / 1000 + pos;
	          }
	        } else {
	          duration = self._sprite[sprite][1] / 1000 - (pos - self._sprite[sprite][0] / 1000);
	        }

	        // determine if this sound should be looped
	        var loop = !!(self._loop || self._sprite[sprite][2]);

	        // set timer to fire the 'onend' event
	        var soundId = (typeof callback === 'string') ? callback : Math.round(Date.now() * Math.random()) + '',
	          timerId;
	        (function() {
	          var data = {
	            id: soundId,
	            sprite: sprite,
	            loop: loop
	          };
	          timerId = setTimeout(function() {
	            // if looping, restart the track
	            if (!self._webAudio && loop) {
	              self.stop(data.id).play(sprite, data.id);
	            }

	            // set web audio node to paused at end
	            if (self._webAudio && !loop) {
	              self._nodeById(data.id).paused = true;
	              self._nodeById(data.id)._pos = 0;

	              // clear the end timer
	              self._clearEndTimer(data.id);
	            }

	            // end the track if it is HTML audio and a sprite
	            if (!self._webAudio && !loop) {
	              self.stop(data.id);
	            }

	            // fire ended event
	            self.on('end', soundId);
	          }, duration * 1000);

	          // store the reference to the timer
	          self._onendTimer.push({timer: timerId, id: data.id});
	        })();

	        if (self._webAudio) {
	          var loopStart = self._sprite[sprite][0] / 1000,
	            loopEnd = self._sprite[sprite][1] / 1000;

	          // set the play id to this node and load into context
	          node.id = soundId;
	          node.paused = false;
	          refreshBuffer(self, [loop, loopStart, loopEnd], soundId);
	          self._playStart = ctx.currentTime;
	          node.gain.value = self._volume;

	          if (typeof node.bufferSource.start === 'undefined') {
	            loop ? node.bufferSource.noteGrainOn(0, pos, 86400) : node.bufferSource.noteGrainOn(0, pos, duration);
	          } else {
	            loop ? node.bufferSource.start(0, pos, 86400) : node.bufferSource.start(0, pos, duration);
	          }
	        } else {
	          if (node.readyState === 4 || !node.readyState && navigator.isCocoonJS) {
	            node.readyState = 4;
	            node.id = soundId;
	            node.currentTime = pos;
	            node.muted = Howler._muted || node.muted;
	            node.volume = self._volume * Howler.volume();
	            setTimeout(function() { node.play(); }, 0);
	          } else {
	            self._clearEndTimer(soundId);

	            (function(){
	              var sound = self,
	                playSprite = sprite,
	                fn = callback,
	                newNode = node;
	              var listener = function() {
	                sound.play(playSprite, fn);

	                // clear the event listener
	                newNode.removeEventListener('canplaythrough', listener, false);
	              };
	              newNode.addEventListener('canplaythrough', listener, false);
	            })();

	            return self;
	          }
	        }

	        // fire the play event and send the soundId back in the callback
	        self.on('play');
	        if (typeof callback === 'function') callback(soundId);

	        return self;
	      });

	      return self;
	    },

	    /**
	     * Pause playback and save the current position.
	     * @param {String} id (optional) The play instance ID.
	     * @return {Howl}
	     */
	    pause: function(id) {
	      var self = this;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('play', function() {
	          self.pause(id);
	        });

	        return self;
	      }

	      // clear 'onend' timer
	      self._clearEndTimer(id);

	      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	      if (activeNode) {
	        activeNode._pos = self.pos(null, id);

	        if (self._webAudio) {
	          // make sure the sound has been created
	          if (!activeNode.bufferSource || activeNode.paused) {
	            return self;
	          }

	          activeNode.paused = true;
	          if (typeof activeNode.bufferSource.stop === 'undefined') {
	            activeNode.bufferSource.noteOff(0);
	          } else {
	            activeNode.bufferSource.stop(0);
	          }
	        } else {
	          activeNode.pause();
	        }
	      }

	      self.on('pause');

	      return self;
	    },

	    /**
	     * Stop playback and reset to start.
	     * @param  {String} id  (optional) The play instance ID.
	     * @return {Howl}
	     */
	    stop: function(id) {
	      var self = this;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('play', function() {
	          self.stop(id);
	        });

	        return self;
	      }

	      // clear 'onend' timer
	      self._clearEndTimer(id);

	      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	      if (activeNode) {
	        activeNode._pos = 0;

	        if (self._webAudio) {
	          // make sure the sound has been created
	          if (!activeNode.bufferSource || activeNode.paused) {
	            return self;
	          }

	          activeNode.paused = true;

	          if (typeof activeNode.bufferSource.stop === 'undefined') {
	            activeNode.bufferSource.noteOff(0);
	          } else {
	            activeNode.bufferSource.stop(0);
	          }
	        } else if (!isNaN(activeNode.duration)) {
	          activeNode.pause();
	          activeNode.currentTime = 0;
	        }
	      }

	      return self;
	    },

	    /**
	     * Mute this sound.
	     * @param  {String} id (optional) The play instance ID.
	     * @return {Howl}
	     */
	    mute: function(id) {
	      var self = this;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('play', function() {
	          self.mute(id);
	        });

	        return self;
	      }

	      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	      if (activeNode) {
	        if (self._webAudio) {
	          activeNode.gain.value = 0;
	        } else {
	          activeNode.muted = true;
	        }
	      }

	      return self;
	    },

	    /**
	     * Unmute this sound.
	     * @param  {String} id (optional) The play instance ID.
	     * @return {Howl}
	     */
	    unmute: function(id) {
	      var self = this;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('play', function() {
	          self.unmute(id);
	        });

	        return self;
	      }

	      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	      if (activeNode) {
	        if (self._webAudio) {
	          activeNode.gain.value = self._volume;
	        } else {
	          activeNode.muted = false;
	        }
	      }

	      return self;
	    },

	    /**
	     * Get/set volume of this sound.
	     * @param  {Float}  vol Volume from 0.0 to 1.0.
	     * @param  {String} id  (optional) The play instance ID.
	     * @return {Howl/Float}     Returns self or current volume.
	     */
	    volume: function(vol, id) {
	      var self = this;

	      // make sure volume is a number
	      vol = parseFloat(vol);

	      if (vol >= 0 && vol <= 1) {
	        self._volume = vol;

	        // if the sound hasn't been loaded, add it to the event queue
	        if (!self._loaded) {
	          self.on('play', function() {
	            self.volume(vol, id);
	          });

	          return self;
	        }

	        var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	        if (activeNode) {
	          if (self._webAudio) {
	            activeNode.gain.value = vol;
	          } else {
	            activeNode.volume = vol * Howler.volume();
	          }
	        }

	        return self;
	      } else {
	        return self._volume;
	      }
	    },

	    /**
	     * Get/set whether to loop the sound.
	     * @param  {Boolean} loop To loop or not to loop, that is the question.
	     * @return {Howl/Boolean}      Returns self or current looping value.
	     */
	    loop: function(loop) {
	      var self = this;

	      if (typeof loop === 'boolean') {
	        self._loop = loop;

	        return self;
	      } else {
	        return self._loop;
	      }
	    },

	    /**
	     * Get/set sound sprite definition.
	     * @param  {Object} sprite Example: {spriteName: [offset, duration, loop]}
	     *                @param {Integer} offset   Where to begin playback in milliseconds
	     *                @param {Integer} duration How long to play in milliseconds
	     *                @param {Boolean} loop     (optional) Set true to loop this sprite
	     * @return {Howl}        Returns current sprite sheet or self.
	     */
	    sprite: function(sprite) {
	      var self = this;

	      if (typeof sprite === 'object') {
	        self._sprite = sprite;

	        return self;
	      } else {
	        return self._sprite;
	      }
	    },

	    /**
	     * Get/set the position of playback.
	     * @param  {Float}  pos The position to move current playback to.
	     * @param  {String} id  (optional) The play instance ID.
	     * @return {Howl/Float}      Returns self or current playback position.
	     */
	    pos: function(pos, id) {
	      var self = this;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('load', function() {
	          self.pos(pos);
	        });

	        return typeof pos === 'number' ? self : self._pos || 0;
	      }

	      // make sure we are dealing with a number for pos
	      pos = parseFloat(pos);

	      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	      if (activeNode) {
	        if (pos >= 0) {
	          self.pause(id);
	          activeNode._pos = pos;
	          self.play(activeNode._sprite, id);

	          return self;
	        } else {
	          return self._webAudio ? activeNode._pos + (ctx.currentTime - self._playStart) : activeNode.currentTime;
	        }
	      } else if (pos >= 0) {
	        return self;
	      } else {
	        // find the first inactive node to return the pos for
	        for (var i=0; i<self._audioNode.length; i++) {
	          if (self._audioNode[i].paused && self._audioNode[i].readyState === 4) {
	            return (self._webAudio) ? self._audioNode[i]._pos : self._audioNode[i].currentTime;
	          }
	        }
	      }
	    },

	    /**
	     * Get/set the 3D position of the audio source.
	     * The most common usage is to set the 'x' position
	     * to affect the left/right ear panning. Setting any value higher than
	     * 1.0 will begin to decrease the volume of the sound as it moves further away.
	     * NOTE: This only works with Web Audio API, HTML5 Audio playback
	     * will not be affected.
	     * @param  {Float}  x  The x-position of the playback from -1000.0 to 1000.0
	     * @param  {Float}  y  The y-position of the playback from -1000.0 to 1000.0
	     * @param  {Float}  z  The z-position of the playback from -1000.0 to 1000.0
	     * @param  {String} id (optional) The play instance ID.
	     * @return {Howl/Array}   Returns self or the current 3D position: [x, y, z]
	     */
	    pos3d: function(x, y, z, id) {
	      var self = this;

	      // set a default for the optional 'y' & 'z'
	      y = (typeof y === 'undefined' || !y) ? 0 : y;
	      z = (typeof z === 'undefined' || !z) ? -0.5 : z;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('play', function() {
	          self.pos3d(x, y, z, id);
	        });

	        return self;
	      }

	      if (x >= 0 || x < 0) {
	        if (self._webAudio) {
	          var activeNode = (id) ? self._nodeById(id) : self._activeNode();
	          if (activeNode) {
	            self._pos3d = [x, y, z];
	            activeNode.panner.setPosition(x, y, z);
	            activeNode.panner.panningModel = self._model || 'HRTF';
	          }
	        }
	      } else {
	        return self._pos3d;
	      }

	      return self;
	    },

	    /**
	     * Fade a currently playing sound between two volumes.
	     * @param  {Number}   from     The volume to fade from (0.0 to 1.0).
	     * @param  {Number}   to       The volume to fade to (0.0 to 1.0).
	     * @param  {Number}   len      Time in milliseconds to fade.
	     * @param  {Function} callback (optional) Fired when the fade is complete.
	     * @param  {String}   id       (optional) The play instance ID.
	     * @return {Howl}
	     */
	    fade: function(from, to, len, callback, id) {
	      var self = this,
	        diff = Math.abs(from - to),
	        dir = from > to ? 'down' : 'up',
	        steps = diff / 0.01,
	        stepTime = len / steps;

	      // if the sound hasn't been loaded, add it to the event queue
	      if (!self._loaded) {
	        self.on('load', function() {
	          self.fade(from, to, len, callback, id);
	        });

	        return self;
	      }

	      // set the volume to the start position
	      self.volume(from, id);

	      for (var i=1; i<=steps; i++) {
	        (function() {
	          var change = self._volume + (dir === 'up' ? 0.01 : -0.01) * i,
	            vol = Math.round(1000 * change) / 1000,
	            toVol = to;

	          setTimeout(function() {
	            self.volume(vol, id);

	            if (vol === toVol) {
	              if (callback) callback();
	            }
	          }, stepTime * i);
	        })();
	      }
	    },

	    /**
	     * [DEPRECATED] Fade in the current sound.
	     * @param  {Float}    to      Volume to fade to (0.0 to 1.0).
	     * @param  {Number}   len     Time in milliseconds to fade.
	     * @param  {Function} callback
	     * @return {Howl}
	     */
	    fadeIn: function(to, len, callback) {
	      return this.volume(0).play().fade(0, to, len, callback);
	    },

	    /**
	     * [DEPRECATED] Fade out the current sound and pause when finished.
	     * @param  {Float}    to       Volume to fade to (0.0 to 1.0).
	     * @param  {Number}   len      Time in milliseconds to fade.
	     * @param  {Function} callback
	     * @param  {String}   id       (optional) The play instance ID.
	     * @return {Howl}
	     */
	    fadeOut: function(to, len, callback, id) {
	      var self = this;

	      return self.fade(self._volume, to, len, function() {
	        if (callback) callback();
	        self.pause(id);

	        // fire ended event
	        self.on('end');
	      }, id);
	    },

	    /**
	     * Get an audio node by ID.
	     * @return {Howl} Audio node.
	     */
	    _nodeById: function(id) {
	      var self = this,
	        node = self._audioNode[0];

	      // find the node with this ID
	      for (var i=0; i<self._audioNode.length; i++) {
	        if (self._audioNode[i].id === id) {
	          node = self._audioNode[i];
	          break;
	        }
	      }

	      return node;
	    },

	    /**
	     * Get the first active audio node.
	     * @return {Howl} Audio node.
	     */
	    _activeNode: function() {
	      var self = this,
	        node = null;

	      // find the first playing node
	      for (var i=0; i<self._audioNode.length; i++) {
	        if (!self._audioNode[i].paused) {
	          node = self._audioNode[i];
	          break;
	        }
	      }

	      // remove excess inactive nodes
	      self._drainPool();

	      return node;
	    },

	    /**
	     * Get the first inactive audio node.
	     * If there is none, create a new one and add it to the pool.
	     * @param  {Function} callback Function to call when the audio node is ready.
	     */
	    _inactiveNode: function(callback) {
	      var self = this,
	        node = null;

	      // find first inactive node to recycle
	      for (var i=0; i<self._audioNode.length; i++) {
	        if (self._audioNode[i].paused && self._audioNode[i].readyState === 4) {
	          // send the node back for use by the new play instance
	          callback(self._audioNode[i]);
	          node = true;
	          break;
	        }
	      }

	      // remove excess inactive nodes
	      self._drainPool();

	      if (node) {
	        return;
	      }

	      // create new node if there are no inactives
	      var newNode;
	      if (self._webAudio) {
	        newNode = self._setupAudioNode();
	        callback(newNode);
	      } else {
	        self.load();
	        newNode = self._audioNode[self._audioNode.length - 1];

	        // listen for the correct load event and fire the callback
	        var listenerEvent = navigator.isCocoonJS ? 'canplaythrough' : 'loadedmetadata';
	        var listener = function() {
	          newNode.removeEventListener(listenerEvent, listener, false);
	          callback(newNode);
	        };
	        newNode.addEventListener(listenerEvent, listener, false);
	      }
	    },

	    /**
	     * If there are more than 5 inactive audio nodes in the pool, clear out the rest.
	     */
	    _drainPool: function() {
	      var self = this,
	        inactive = 0,
	        i;

	      // count the number of inactive nodes
	      for (i=0; i<self._audioNode.length; i++) {
	        if (self._audioNode[i].paused) {
	          inactive++;
	        }
	      }

	      // remove excess inactive nodes
	      for (i=self._audioNode.length-1; i>=0; i--) {
	        if (inactive <= 5) {
	          break;
	        }

	        if (self._audioNode[i].paused) {
	          // disconnect the audio source if using Web Audio
	          if (self._webAudio) {
	            self._audioNode[i].disconnect(0);
	          }

	          inactive--;
	          self._audioNode.splice(i, 1);
	        }
	      }
	    },

	    /**
	     * Clear 'onend' timeout before it ends.
	     * @param  {String} soundId  The play instance ID.
	     */
	    _clearEndTimer: function(soundId) {
	      var self = this,
	        index = 0;

	      // loop through the timers to find the one associated with this sound
	      for (var i=0; i<self._onendTimer.length; i++) {
	        if (self._onendTimer[i].id === soundId) {
	          index = i;
	          break;
	        }
	      }

	      var timer = self._onendTimer[index];
	      if (timer) {
	        clearTimeout(timer.timer);
	        self._onendTimer.splice(index, 1);
	      }
	    },

	    /**
	     * Setup the gain node and panner for a Web Audio instance.
	     * @return {Object} The new audio node.
	     */
	    _setupAudioNode: function() {
	      var self = this,
	        node = self._audioNode,
	        index = self._audioNode.length;

	      // create gain node
	      node[index] = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
	      node[index].gain.value = self._volume;
	      node[index].paused = true;
	      node[index]._pos = 0;
	      node[index].readyState = 4;
	      node[index].connect(masterGain);

	      // create the panner
	      node[index].panner = ctx.createPanner();
	      node[index].panner.panningModel = self._model || 'equalpower';
	      node[index].panner.setPosition(self._pos3d[0], self._pos3d[1], self._pos3d[2]);
	      node[index].panner.connect(node[index]);

	      return node[index];
	    },

	    /**
	     * Call/set custom events.
	     * @param  {String}   event Event type.
	     * @param  {Function} fn    Function to call.
	     * @return {Howl}
	     */
	    on: function(event, fn) {
	      var self = this,
	        events = self['_on' + event];

	      if (typeof fn === 'function') {
	        events.push(fn);
	      } else {
	        for (var i=0; i<events.length; i++) {
	          if (fn) {
	            events[i].call(self, fn);
	          } else {
	            events[i].call(self);
	          }
	        }
	      }

	      return self;
	    },

	    /**
	     * Remove a custom event.
	     * @param  {String}   event Event type.
	     * @param  {Function} fn    Listener to remove.
	     * @return {Howl}
	     */
	    off: function(event, fn) {
	      var self = this,
	        events = self['_on' + event],
	        fnString = fn ? fn.toString() : null;

	      if (fnString) {
	        // loop through functions in the event for comparison
	        for (var i=0; i<events.length; i++) {
	          if (fnString === events[i].toString()) {
	            events.splice(i, 1);
	            break;
	          }
	        }
	      } else {
	        self['_on' + event] = [];
	      }

	      return self;
	    },

	    /**
	     * Unload and destroy the current Howl object.
	     * This will immediately stop all play instances attached to this sound.
	     */
	    unload: function() {
	      var self = this;

	      // stop playing any active nodes
	      var nodes = self._audioNode;
	      for (var i=0; i<self._audioNode.length; i++) {
	        // stop the sound if it is currently playing
	        if (!nodes[i].paused) {
	          self.stop(nodes[i].id);
	          self.on('end', nodes[i].id);
	        }

	        if (!self._webAudio) {
	          // remove the source if using HTML5 Audio
	          nodes[i].src = '';
	        } else {
	          // disconnect the output from the master gain
	          nodes[i].disconnect(0);
	        }
	      }

	      // make sure all timeouts are cleared
	      for (i=0; i<self._onendTimer.length; i++) {
	        clearTimeout(self._onendTimer[i].timer);
	      }

	      // remove the reference in the global Howler object
	      var index = Howler._howls.indexOf(self);
	      if (index !== null && index >= 0) {
	        Howler._howls.splice(index, 1);
	      }

	      // delete this sound from the cache
	      delete cache[self._src];
	      self = null;
	    }

	  };

	  // only define these functions when using WebAudio
	  if (usingWebAudio) {

	    /**
	     * Buffer a sound from URL (or from cache) and decode to audio source (Web Audio API).
	     * @param  {Object} obj The Howl object for the sound to load.
	     * @param  {String} url The path to the sound file.
	     */
	    var loadBuffer = function(obj, url) {
	      // check if the buffer has already been cached
	      if (url in cache) {
	        // set the duration from the cache
	        obj._duration = cache[url].duration;

	        // load the sound into this object
	        loadSound(obj);
	        return;
	      }
	      
	      if (/^data:[^;]+;base64,/.test(url)) {
	        // Decode base64 data-URIs because some browsers cannot load data-URIs with XMLHttpRequest.
	        var data = atob(url.split(',')[1]);
	        var dataView = new Uint8Array(data.length);
	        for (var i=0; i<data.length; ++i) {
	          dataView[i] = data.charCodeAt(i);
	        }
	        
	        decodeAudioData(dataView.buffer, obj, url);
	      } else {
	        // load the buffer from the URL
	        var xhr = new XMLHttpRequest();
	        xhr.open('GET', url, true);
	        xhr.responseType = 'arraybuffer';
	        xhr.onload = function() {
	          decodeAudioData(xhr.response, obj, url);
	        };
	        xhr.onerror = function() {
	          // if there is an error, switch the sound to HTML Audio
	          if (obj._webAudio) {
	            obj._buffer = true;
	            obj._webAudio = false;
	            obj._audioNode = [];
	            delete obj._gainNode;
	            delete cache[url];
	            obj.load();
	          }
	        };
	        try {
	          xhr.send();
	        } catch (e) {
	          xhr.onerror();
	        }
	      }
	    };

	    /**
	     * Decode audio data from an array buffer.
	     * @param  {ArrayBuffer} arraybuffer The audio data.
	     * @param  {Object} obj The Howl object for the sound to load.
	     * @param  {String} url The path to the sound file.
	     */
	    var decodeAudioData = function(arraybuffer, obj, url) {
	      // decode the buffer into an audio source
	      ctx.decodeAudioData(
	        arraybuffer,
	        function(buffer) {
	          if (buffer) {
	            cache[url] = buffer;
	            loadSound(obj, buffer);
	          }
	        },
	        function(err) {
	          obj.on('loaderror');
	        }
	      );
	    };

	    /**
	     * Finishes loading the Web Audio API sound and fires the loaded event
	     * @param  {Object}  obj    The Howl object for the sound to load.
	     * @param  {Objecct} buffer The decoded buffer sound source.
	     */
	    var loadSound = function(obj, buffer) {
	      // set the duration
	      obj._duration = (buffer) ? buffer.duration : obj._duration;

	      // setup a sprite if none is defined
	      if (Object.getOwnPropertyNames(obj._sprite).length === 0) {
	        obj._sprite = {_default: [0, obj._duration * 1000]};
	      }

	      // fire the loaded event
	      if (!obj._loaded) {
	        obj._loaded = true;
	        obj.on('load');
	      }

	      if (obj._autoplay) {
	        obj.play();
	      }
	    };

	    /**
	     * Load the sound back into the buffer source.
	     * @param  {Object} obj   The sound to load.
	     * @param  {Array}  loop  Loop boolean, pos, and duration.
	     * @param  {String} id    (optional) The play instance ID.
	     */
	    var refreshBuffer = function(obj, loop, id) {
	      // determine which node to connect to
	      var node = obj._nodeById(id);

	      // setup the buffer source for playback
	      node.bufferSource = ctx.createBufferSource();
	      node.bufferSource.buffer = cache[obj._src];
	      node.bufferSource.connect(node.panner);
	      node.bufferSource.loop = loop[0];
	      if (loop[0]) {
	        node.bufferSource.loopStart = loop[1];
	        node.bufferSource.loopEnd = loop[1] + loop[2];
	      }
	      node.bufferSource.playbackRate.value = obj._rate;
	    };

	  }

	  /**
	   * Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
	   */
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return {
	        Howler: Howler,
	        Howl: Howl
	      };
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }

	  /**
	   * Add support for CommonJS libraries such as browserify.
	   */
	  if (true) {
	    exports.Howler = Howler;
	    exports.Howl = Howl;
	  }

	  // define globally in case AMD is not available or available but not used

	  if (typeof window !== 'undefined') {
	    window.Howler = Howler;
	    window.Howl = Howl;
	  }

	})();


/***/ },

/***/ 221:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(185)['default'];

	var _classCallCheck = __webpack_require__(188)['default'];

	var _Math$sign = __webpack_require__(222)['default'];

	var _interopRequireDefault = __webpack_require__(1)['default'];

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _jquery = __webpack_require__(226);

	var _jquery2 = _interopRequireDefault(_jquery);

	var DEFAULT_OPTIONS = {
	  bufferLength: 30, // around 0.5s in practice, as Leap Motion is providing ~60 samples per second
	  minAmplitude: 20
	};

	var DirectionChange = (function () {
	  function DirectionChange(options) {
	    _classCallCheck(this, DirectionChange);

	    this.options = _jquery2['default'].extend({}, DEFAULT_OPTIONS, options);
	    this._vel = [];
	    this._halfPeriodMaxVel = -Infinity;
	    this._lastDirChange = null;
	    // Outputs:
	    this.frequency = 0;
	    this.halfPeriodMaxVel = 0;
	  }

	  _createClass(DirectionChange, [{
	    key: 'addSample',
	    value: function addSample(vel) {
	      this._vel.unshift(vel);
	      if (this._vel.length > this.options.bufferLength) {
	        this._vel.length = this.options.bufferLength;
	      }
	      this._check();
	    }

	    // We assume that direction has changed when velocity changes its sign and:
	    //  max velocity before the sign change is greater than options.minAmplitude
	    //  AND
	    //  max velocity after the sign change is greater than options.minAmplitude
	  }, {
	    key: '_check',
	    value: function _check() {
	      var v = this._vel;
	      var len = v.length;
	      var minAmp = this.options.minAmplitude;
	      var signChangeCount = 0;
	      var initialMax = -Infinity;
	      var currentMax = -Infinity;
	      var bufferMax = -Infinity;
	      for (var i = 0; i < len; i++) {
	        currentMax = Math.max(currentMax, Math.abs(v[i]));
	        bufferMax = Math.max(bufferMax, currentMax);
	        this._halfPeriodMaxVel = Math.max(this._halfPeriodMaxVel, currentMax);
	        // Note that if the sign has changed 2 or 4 times, in fact it means it hasn't changed. That's why we test % 2.
	        if (currentMax >= minAmp && initialMax >= minAmp && signChangeCount % 2 === 1) {
	          this._directionChanged({
	            type: v[i] > 0 ? DirectionChange.RIGHT_TO_LEFT : DirectionChange.LEFT_TO_RIGHT
	          });
	          return;
	        }
	        if (i + 1 < len) {
	          if (_Math$sign(v[i]) !== _Math$sign(v[i + 1])) {
	            if (signChangeCount === 0) {
	              // Save the max velocity before the fist sign change.
	              initialMax = currentMax;
	            }
	            signChangeCount += 1;
	            currentMax = -Infinity;
	          }
	        }
	      }
	      if (len === this.options.bufferLength && bufferMax < minAmp) {
	        this._stopped();
	      }
	    }
	  }, {
	    key: '_directionChanged',
	    value: function _directionChanged(data) {
	      var timestamp = performance.now();
	      if (this._lastDirChange) {
	        // Calculate outputs.
	        this.frequency = 0.5 * 1000 / (timestamp - this._lastDirChange);
	        this.halfPeriodMaxVel = this._halfPeriodMaxVel;
	      }
	      this._lastDirChange = timestamp;

	      this._vel.length = 1;
	      this._halfPeriodMaxVel = -Infinity;

	      if (this.options.onDirChange) {
	        this.options.onDirChange(data);
	      }
	    }
	  }, {
	    key: '_stopped',
	    value: function _stopped() {
	      // Calculate outputs.
	      this.frequency = 0;
	      this.halfPeriodMaxVel = 0;

	      this._lastDirChange = performance.now();

	      if (this.options.onStop) {
	        this.options.onStop();
	      }
	    }
	  }]);

	  return DirectionChange;
	})();

	DirectionChange.LEFT_TO_RIGHT = 0;
	DirectionChange.RIGHT_TO_LEFT = 1;

	exports['default'] = DirectionChange;
	module.exports = exports['default'];

/***/ },

/***/ 222:
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(223), __esModule: true };

/***/ },

/***/ 223:
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(224);
	module.exports = __webpack_require__(172).Math.sign;

/***/ },

/***/ 224:
/***/ function(module, exports, __webpack_require__) {

	// 20.2.2.28 Math.sign(x)
	var $def = __webpack_require__(170);

	$def($def.S, 'Math', {sign: __webpack_require__(225)});

/***/ },

/***/ 225:
/***/ function(module, exports) {

	// 20.2.2.28 Math.sign(x)
	module.exports = Math.sign || function sign(x){
	  return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
	};

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
	      var sound = new _howler.Howl({
	        urls: ['tap.wav']
	      });
	      this.freqCalc = new _toolsDirectionChange2['default']({
	        minAmplitude: this.config.minAmplitude,
	        onDirChange: (function (data) {
	          if (this.hand && (this.hand.type === 'right' && data.type === _toolsDirectionChange2['default'].LEFT_TO_RIGHT || this.hand.type === 'left' && data.type === _toolsDirectionChange2['default'].RIGHT_TO_LEFT)) {
	            // Sound effect!
	            sound.play();
	          }
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
	      this.freqCalc.addSample(this.hand.palmVelocity[0]);
	      this.freq = this.freqCalc.frequency;
	      this.maxVel = this.freqCalc.halfPeriodMaxVel;
	      this.callback();
	      return null;
	    }
	  }]);

	  return FistBump;
	})();

	exports['default'] = FistBump;
	module.exports = exports['default'];

/***/ },

/***/ 259:
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

	var _gesturesFistBump = __webpack_require__(255);

	var _gesturesFistBump2 = _interopRequireDefault(_gesturesFistBump);

	var _toolsAvg = __webpack_require__(218);

	var _toolsAvg2 = _interopRequireDefault(_toolsAvg);

	var _iframePhone = __webpack_require__(249);

	var _iframePhone2 = _interopRequireDefault(_iframePhone);

	var _leapStandardInfoJsx = __webpack_require__(227);

	var _leapStandardInfoJsx2 = _interopRequireDefault(_leapStandardInfoJsx);

	var MAX_VOL = 0.82;
	var MIN_VOL = 0.1;

	var LabVolumePressure = (function (_React$Component) {
	  _inherits(LabVolumePressure, _React$Component);

	  function LabVolumePressure() {
	    _classCallCheck(this, LabVolumePressure);

	    _get(Object.getPrototypeOf(LabVolumePressure.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(LabVolumePressure, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.fistBump = new _gesturesFistBump2['default'](this.props.handBumpConfig, this.gestureDetected.bind(this), this.plotter);
	      this.setupLabCommunication();
	      this.volume = MAX_VOL;
	      this.volumeUpdateIntID = setInterval((function () {
	        this.labPhone.post('set', { name: 'volume', value: this.volume });
	      }).bind(this), 75);
	    }
	  }, {
	    key: 'componentWillUnmount',
	    value: function componentWillUnmount() {
	      this.labPhone.disconnect();
	      clearInterval(this.volumeUpdateIntID);
	    }
	  }, {
	    key: 'setupLabCommunication',
	    value: function setupLabCommunication() {
	      this.labPhone = new _iframePhone2['default'].ParentEndpoint(this.refs.labModel);
	      this.labPhone.addListener('modelLoaded', (function () {
	        this.labPhone.post('play');
	      }).bind(this));
	    }
	  }, {
	    key: 'gestureDetected',
	    value: function gestureDetected() {
	      _toolsAvg2['default'].addSample('freq', this.fistBump.freq, Math.round(this.props.freqAvg));
	      var freq = _toolsAvg2['default'].getAvg('freq');
	      this.volume = Math.max(MIN_VOL, Math.min(MAX_VOL, MAX_VOL - this.props.volumeMult * freq));
	      this.plotter.showCanvas('gesture-detected');
	      this.plotter.plot('frequency', freq, { min: 0, max: 9, precision: 2 });
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
	      return _react2['default'].createElement(
	        'div',
	        null,
	        _react2['default'].createElement(
	          'div',
	          null,
	          _react2['default'].createElement('iframe', { ref: 'labModel', width: '610px', height: '350px', frameBorder: '0', src: 'http://lab.concord.org/embeddable.html#interactives/grasp/volume-pressure-relationship.json' })
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

	  return LabVolumePressure;
	})(_react2['default'].Component);

	exports['default'] = LabVolumePressure;

	LabVolumePressure.defaultProps = {
	  volumeMult: 0.11,
	  maxVelAvg: 120,
	  handBumpConfig: {
	    closedGrabStrength: 0.4,
	    openGrabStrength: 0.7,
	    handTwistTolerance: 0.7,
	    minAmplitude: 20
	  }
	};

	_reactMixin2['default'].onClass(LabVolumePressure, _mixinsLeapStateHandling2['default']);
	module.exports = exports['default'];

/***/ }

});