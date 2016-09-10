/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _jsreportStudio = __webpack_require__(1);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }
	
	_jsreportStudio2.default.previewListeners.push(function () {
	  setTimeout(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
	    var response;
	    return regeneratorRuntime.wrap(function _callee$(_context) {
	      while (1) {
	        switch (_context.prev = _context.next) {
	          case 0:
	            _context.next = 2;
	            return _jsreportStudio2.default.api.get('/api/settings');
	
	          case 2:
	            response = _context.sent;
	
	            _jsreportStudio2.default.authentication.user.timeSpent = response.tenant.timeSpent;
	
	          case 4:
	          case 'end':
	            return _context.stop();
	        }
	      }
	    }, _callee, undefined);
	  })), 5000);
	});
	
	_jsreportStudio2.default.initializeListeners.push(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
	  return regeneratorRuntime.wrap(function _callee2$(_context2) {
	    while (1) {
	      switch (_context2.prev = _context2.next) {
	        case 0:
	          _jsreportStudio2.default.addToolbarComponent(function () {
	            return React.createElement(
	              'div',
	              { className: 'toolbar-button' },
	              React.createElement(
	                'span',
	                null,
	                Math.round(_jsreportStudio2.default.authentication.user.timeSpent / 1000),
	                ' / ',
	                _jsreportStudio2.default.authentication.user.creditsAvailable
	              )
	            );
	          }, 'right');
	
	        case 1:
	        case 'end':
	          return _context2.stop();
	      }
	    }
	  }, _callee2, undefined);
	})));

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = Studio;

/***/ }
/******/ ]);