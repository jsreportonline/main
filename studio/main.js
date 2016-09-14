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
	
	var _BillingEditor = __webpack_require__(2);
	
	var _BillingEditor2 = _interopRequireDefault(_BillingEditor);
	
	var _BillingButton = __webpack_require__(5);
	
	var _BillingButton2 = _interopRequireDefault(_BillingButton);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }
	
	_jsreportStudio2.default.addEditorComponent('billing', _BillingEditor2.default);
	
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
	          _jsreportStudio2.default.authentication.user.billingHistory = _jsreportStudio2.default.authentication.user.billingHistory || [];
	
	          _jsreportStudio2.default.addToolbarComponent(_BillingButton2.default, 'right');
	          _jsreportStudio2.default.addToolbarComponent(function () {
	            return React.createElement(
	              'div',
	              {
	                className: 'toolbar-button',
	                onClick: function onClick() {
	                  return _jsreportStudio2.default.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' });
	                } },
	              React.createElement('i', { className: 'fa fa-usd' }),
	              ' Billing'
	            );
	          }, 'settings');
	
	        case 3:
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

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _reactList = __webpack_require__(3);
	
	var _reactList2 = _interopRequireDefault(_reactList);
	
	var _react = __webpack_require__(4);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(1);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var ReportEditor = function (_Component) {
	  _inherits(ReportEditor, _Component);
	
	  function ReportEditor() {
	    _classCallCheck(this, ReportEditor);
	
	    return _possibleConstructorReturn(this, (ReportEditor.__proto__ || Object.getPrototypeOf(ReportEditor)).apply(this, arguments));
	  }
	
	  _createClass(ReportEditor, [{
	    key: 'renderItem',
	    value: function renderItem(index) {
	      var item = _jsreportStudio2.default.authentication.user.billingHistory[index];
	      return _react2.default.createElement(
	        'tr',
	        { key: index },
	        _react2.default.createElement(
	          'td',
	          null,
	          item.billedDate.toLocaleString()
	        ),
	        _react2.default.createElement(
	          'td',
	          null,
	          item.creditsSpent
	        )
	      );
	    }
	  }, {
	    key: 'renderItems',
	    value: function renderItems(items, ref) {
	      return _react2.default.createElement(
	        'table',
	        { className: 'table', ref: ref },
	        _react2.default.createElement(
	          'thead',
	          null,
	          _react2.default.createElement(
	            'tr',
	            null,
	            _react2.default.createElement(
	              'th',
	              null,
	              'billed date'
	            ),
	            _react2.default.createElement(
	              'th',
	              null,
	              'credits spent'
	            )
	          )
	        ),
	        _react2.default.createElement(
	          'tbody',
	          null,
	          items
	        )
	      );
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      return _react2.default.createElement(
	        'div',
	        { className: 'block custom-editor' },
	        _react2.default.createElement(
	          'div',
	          null,
	          _react2.default.createElement(
	            'h1',
	            null,
	            _react2.default.createElement('i', { className: 'fa fa-home' }),
	            ' ',
	            _jsreportStudio2.default.authentication.user.name,
	            ' '
	          ),
	          _react2.default.createElement(
	            'small',
	            null,
	            'created on: ',
	            _jsreportStudio2.default.authentication.user.createdOn.toLocaleString()
	          ),
	          _react2.default.createElement('br', null),
	          _react2.default.createElement(
	            'small',
	            null,
	            'admin email: ',
	            _jsreportStudio2.default.authentication.user.email
	          )
	        ),
	        _react2.default.createElement(
	          'div',
	          null,
	          _react2.default.createElement(
	            'h2',
	            null,
	            'current billing plan'
	          ),
	          _react2.default.createElement(
	            'button',
	            { style: { marginLeft: '0rem' }, className: 'button confirmation' },
	            _jsreportStudio2.default.authentication.user.plan || 'free',
	            ' ',
	            Math.round(_jsreportStudio2.default.authentication.user.timeSpent / 1000),
	            ' / ',
	            _jsreportStudio2.default.authentication.user.creditsAvailable
	          ),
	          _react2.default.createElement(
	            'button',
	            { className: 'button danger', onClick: function onClick() {
	                return console.log('click');
	              } },
	            'Upgrade plan'
	          )
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'block-item' },
	          _react2.default.createElement(
	            'h2',
	            null,
	            'billing history'
	          ),
	          _react2.default.createElement(_reactList2.default, { type: 'uniform', itemsRenderer: this.renderItems, itemRenderer: function itemRenderer(index) {
	              return _this2.renderItem(index);
	            }, length: _jsreportStudio2.default.authentication.user.billingHistory.length })
	        )
	      );
	    }
	  }]);
	
	  return ReportEditor;
	}(_react.Component);
	
	exports.default = ReportEditor;

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = Studio.libraries['react-list'];

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = Studio.libraries['react'];

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(4);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(1);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var ReportsButton = function (_Component) {
	  _inherits(ReportsButton, _Component);
	
	  function ReportsButton() {
	    _classCallCheck(this, ReportsButton);
	
	    return _possibleConstructorReturn(this, (ReportsButton.__proto__ || Object.getPrototypeOf(ReportsButton)).apply(this, arguments));
	  }
	
	  _createClass(ReportsButton, [{
	    key: 'openBilling',
	    value: function openBilling() {
	      _jsreportStudio2.default.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' });
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      return _react2.default.createElement(
	        'div',
	        { onClick: function onClick() {
	            return _this2.openBilling();
	          }, className: 'toolbar-button' },
	        _react2.default.createElement('i', { className: 'fa fa-usd' }),
	        ' ',
	        Math.round(_jsreportStudio2.default.authentication.user.timeSpent / 1000),
	        ' / ',
	        _jsreportStudio2.default.authentication.user.creditsAvailable
	      );
	    }
	  }]);
	
	  return ReportsButton;
	}(_react.Component);
	
	exports.default = ReportsButton;

/***/ }
/******/ ]);