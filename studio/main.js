/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
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
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = Studio;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = Studio.libraries['react'];

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var getTemplatesUsingWindowsExecution = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var _this = this;

    var templates;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            templates = _jsreportStudio2.default.getReferences().templates.filter(function (t) {
              return t.recipe === 'phantom-pdf' || t.recipe === 'wkhtmltopdf';
            });

            if (!(templates.length === 0)) {
              _context4.next = 3;
              break;
            }

            return _context4.abrupt('return', templates);

          case 3:
            _context4.next = 5;
            return Promise.all(templates.map(function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(t) {
                var freshTemplate;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return _jsreportStudio2.default.loadEntity(t._id, true);

                      case 2:
                        freshTemplate = _context3.sent;
                        return _context3.abrupt('return', freshTemplate);

                      case 4:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this);
              }));

              return function (_x) {
                return _ref4.apply(this, arguments);
              };
            }()));

          case 5:
            templates = _context4.sent;
            return _context4.abrupt('return', templates.filter(function (t) {
              return isTemplateUsingWindows(t);
            }));

          case 7:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function getTemplatesUsingWindowsExecution() {
    return _ref3.apply(this, arguments);
  };
}();

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

var _BillingEditor = __webpack_require__(3);

var _BillingEditor2 = _interopRequireDefault(_BillingEditor);

var _superagent = __webpack_require__(5);

var _superagent2 = _interopRequireDefault(_superagent);

var _BillingButton = __webpack_require__(6);

var _BillingButton2 = _interopRequireDefault(_BillingButton);

var _ChangePasswordSettingsButton = __webpack_require__(7);

var _ChangePasswordSettingsButton2 = _interopRequireDefault(_ChangePasswordSettingsButton);

var _ChangeEmailSettingsButton = __webpack_require__(9);

var _ChangeEmailSettingsButton2 = _interopRequireDefault(_ChangeEmailSettingsButton);

var _AboutModal = __webpack_require__(11);

var _AboutModal2 = _interopRequireDefault(_AboutModal);

var _WindowsDeprecationModal = __webpack_require__(12);

var _WindowsDeprecationModal2 = _interopRequireDefault(_WindowsDeprecationModal);

var _ContactEmailModal = __webpack_require__(13);

var _ContactEmailModal2 = _interopRequireDefault(_ContactEmailModal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var localStorage = window.localStorage;

_jsreportStudio2.default.addEditorComponent('billing', _BillingEditor2.default);

_jsreportStudio2.default.setAboutModal(_AboutModal2.default);

_jsreportStudio2.default.readyListeners.push(function () {
  var pendingModalsLaunch = [];
  var creditsExceeded = Math.round(_jsreportStudio2.default.authentication.user.creditsUsed / 1000) > _jsreportStudio2.default.authentication.user.creditsAvailable;

  var isModalUsed = function isModalUsed() {
    return _jsreportStudio2.default.isModalOpen();
  };

  var contactEmailNotRegistered = function contactEmailNotRegistered() {
    return _jsreportStudio2.default.authentication.user && _jsreportStudio2.default.authentication.user.isAdmin && _jsreportStudio2.default.authentication.user.contactEmail == null;
  };

  var windowsDeprecationModal = function windowsDeprecationModal(templates) {
    return _jsreportStudio2.default.openModal(_WindowsDeprecationModal2.default, templates != null ? { templates: templates } : undefined);
  };

  var contactEmailModal = function contactEmailModal() {
    return _jsreportStudio2.default.openModal(_ContactEmailModal2.default);
  };

  var creditsExceededModal = function creditsExceededModal() {
    return _jsreportStudio2.default.openModal(function (props) {
      var creditsAvailable = _jsreportStudio2.default.authentication.user.creditsAvailable;
      var creditsUsed = Math.round(_jsreportStudio2.default.authentication.user.creditsUsed / 1000);

      return React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          null,
          'The monthly prepaid credits in your account has been exceeded. Please upgrade your ',
          React.createElement(
            'a',
            { href: 'https://jsreport.net/buy/online', target: '_blank' },
            'jsreportonline plan'
          ),
          ' to avoid service interruption.'
        ),
        React.createElement(
          'p',
          null,
          React.createElement(
            'b',
            null,
            'Available:',
            ' ',
            React.createElement(
              'span',
              { style: { color: '#008000' } },
              creditsAvailable
            )
          ),
          React.createElement('br', null),
          React.createElement(
            'b',
            null,
            'Used:',
            ' ',
            React.createElement(
              'span',
              { style: { color: '#c7a620' } },
              creditsUsed
            )
          ),
          React.createElement('br', null),
          React.createElement(
            'b',
            null,
            'Excess:',
            ' ',
            React.createElement(
              'span',
              { style: { color: '#ff0000' } },
              creditsUsed - creditsAvailable + ' (' + Math.floor((creditsUsed - creditsAvailable) / creditsAvailable * 100) + '%)'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'button-bar' },
          React.createElement(
            'button',
            { className: 'button confirmation', onClick: function onClick() {
                return props.close();
              } },
            'ok'
          )
        )
      );
    });
  };

  var checkMessages = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var request;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              request = _superagent2.default.get(_jsreportStudio2.default.resolveUrl('/api/message'));
              // eslint-disable-next-line handle-callback-err

              request.end(function (err, response) {
                if (response && response.body) {
                  var messageId = localStorage.getItem('messageId');

                  if (isModalUsed()) {
                    return;
                  }

                  if (messageId !== response.body.id) {
                    localStorage.setItem('messageId', response.body.id);

                    _jsreportStudio2.default.openModal(function (props) {
                      return React.createElement(
                        'div',
                        null,
                        React.createElement('div', { dangerouslySetInnerHTML: { __html: response.body.content } }),
                        React.createElement(
                          'div',
                          { className: 'button-bar' },
                          React.createElement(
                            'button',
                            { className: 'button confirmation', onClick: function onClick() {
                                return props.close();
                              } },
                            'ok'
                          )
                        )
                      );
                    });
                  }
                }
              });

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function checkMessages() {
      return _ref.apply(this, arguments);
    };
  }();

  // interval for modal launching
  setInterval(function () {
    if (pendingModalsLaunch.length === 0 || _jsreportStudio2.default.isModalOpen()) {
      return;
    }

    var toLaunch = pendingModalsLaunch.splice(0, 1);

    toLaunch[0]();
  }, 300);

  if (creditsExceeded) {
    pendingModalsLaunch.push(creditsExceededModal);
  }

  getTemplatesUsingWindowsExecution().then(function (templatesUsingWindowsExecution) {
    if (templatesUsingWindowsExecution.length > 0) {
      pendingModalsLaunch.push(function () {
        return windowsDeprecationModal(templatesUsingWindowsExecution);
      });
    }
  }).catch(function (e) {
    console.error('Error trying to detect templates with windows execution:');
    console.error(e);
  });

  if (contactEmailNotRegistered()) {
    pendingModalsLaunch.push(contactEmailModal);
  }

  setInterval(checkMessages, 5 * 60 * 1000);
  checkMessages();

  _jsreportStudio2.default.previewListeners.push(function (request, entities) {
    if (request.template.recipe !== 'phantom-pdf' && request.template.recipe !== 'wkhtmltopdf') {
      return;
    }

    if (isTemplateUsingWindows(request.template)) {
      pendingModalsLaunch.push(windowsDeprecationModal);
    }
  });
});

_jsreportStudio2.default.initializeListeners.push(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _jsreportStudio2.default.authentication.user.billingHistory = _jsreportStudio2.default.authentication.user.billingHistory || [];
          _jsreportStudio2.default.authentication.user.billingHistory.sort(function (a, b) {
            return b.billedDate.getTime() - a.billedDate.getTime();
          });

          _jsreportStudio2.default.addToolbarComponent(_BillingButton2.default, 'right');

          _jsreportStudio2.default.addToolbarComponent(function () {
            return React.createElement(
              'div',
              { className: 'toolbar-button' },
              React.createElement(
                'a',
                { href: 'https://jsreport.net/learn/online-faq', target: '_blank', style: { color: 'inherit', textDecoration: 'none' } },
                React.createElement('i', { className: 'fa fa-info-circle' }),
                ' FAQ'
              )
            );
          }, 'settings');

          _jsreportStudio2.default.addToolbarComponent(function () {
            return React.createElement(
              'div',
              {
                className: 'toolbar-button',
                onClick: function onClick() {
                  return _jsreportStudio2.default.openTab({ key: 'Billing', editorComponentKey: 'billing', title: 'Billing' });
                }
              },
              React.createElement('i', { className: 'fa fa-usd' }),
              ' Billing'
            );
          }, 'settings');

          _jsreportStudio2.default.addToolbarComponent(_ChangePasswordSettingsButton2.default, 'settings');

          _jsreportStudio2.default.addToolbarComponent(_ChangeEmailSettingsButton2.default, 'settings');

        case 7:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, undefined);
})));

function isTemplateUsingWindows(t) {
  if (t == null) {
    return false;
  }

  var defaultPhantomjsChange = new Date(2016, 9, 18);
  var usingWindows = false;
  var isOldTenant = false;

  if (_jsreportStudio2.default.authentication.user.createdOn != null && _jsreportStudio2.default.authentication.user.createdOn < defaultPhantomjsChange) {
    isOldTenant = true;
  }

  var phantomWin = t.recipe === 'phantom-pdf' && (t.phantom != null && t.phantom.phantomjsVersion === '1.9.8-windows' ||
  // requests for old tenants should get the windows fallback
  isOldTenant && (!t.phantom || !t.phantom.phantomjsVersion));

  var wkhtmltopdfWin = t.recipe === 'wkhtmltopdf' && t.wkhtmltopdf != null && t.wkhtmltopdf.wkhtmltopdfVersion === '0.12.3-windows';

  if (phantomWin || wkhtmltopdfWin) {
    usingWindows = true;
  }

  return usingWindows;
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

var _UpgradePlanModal = __webpack_require__(4);

var _UpgradePlanModal2 = _interopRequireDefault(_UpgradePlanModal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
    key: 'openUpgradeModal',
    value: function openUpgradeModal() {
      _jsreportStudio2.default.openModal(_UpgradePlanModal2.default, {});
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.updatePlan();
    }
  }, {
    key: 'updatePlan',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this.updatePlanStarted) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                this.updatePlanStarted = true;
                _jsreportStudio2.default.startProgress();
                setTimeout(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                  var response;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return _jsreportStudio2.default.api.get('/api/settings');

                        case 2:
                          response = _context.sent;

                          _jsreportStudio2.default.authentication.user.plan = response.tenant.plan;
                          _jsreportStudio2.default.authentication.user.creditsAvailable = response.tenant.creditsAvailable;
                          _jsreportStudio2.default.stopProgress();
                          _this2.forceUpdate();
                          _this2.updatePlanStarted = false;

                        case 8:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, _this2);
                })), 6000);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function updatePlan() {
        return _ref.apply(this, arguments);
      }

      return updatePlan;
    }()
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.updatePlan();
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      return _react2.default.createElement(
        'div',
        { className: 'block custom-editor', style: { overflow: 'auto', minHeight: 0, height: 'auto' } },
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
            _react2.default.createElement(
              'b',
              null,
              'created on:'
            ),
            ' ',
            _jsreportStudio2.default.authentication.user.createdOn.toLocaleString()
          ),
          _react2.default.createElement('br', null),
          _react2.default.createElement(
            'small',
            null,
            _react2.default.createElement(
              'b',
              null,
              'admin email:'
            ),
            ' ',
            _jsreportStudio2.default.authentication.user.email
          ),
          _jsreportStudio2.default.authentication.user.contactEmail != null && _react2.default.createElement('br', null),
          _jsreportStudio2.default.authentication.user.contactEmail != null && _react2.default.createElement(
            'small',
            null,
            _react2.default.createElement(
              'b',
              null,
              'contact email:'
            ),
            ' ',
            _jsreportStudio2.default.authentication.user.contactEmail
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
            { style: { marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }, className: 'button confirmation' },
            _jsreportStudio2.default.authentication.user.plan || 'free',
            ' ',
            Math.round(_jsreportStudio2.default.authentication.user.creditsUsed / 1000) + ' ',
            '/ ',
            _jsreportStudio2.default.authentication.user.creditsAvailable
          ),
          _react2.default.createElement(
            'button',
            { className: 'button confirmation', style: { marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }, onClick: function onClick() {
                return _this3.openUpgradeModal();
              } },
            'Upgrade plan'
          ),
          _react2.default.createElement(
            'a',
            { className: 'button confirmation', style: { display: 'inline-block', marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }, href: 'https://gumroad.com/library', target: '_blank' },
            'Payment details'
          ),
          _react2.default.createElement(
            'a',
            { className: 'button danger', style: { display: 'inline-block', marginTop: '0.25rem', marginLeft: '0rem', marginRight: '1rem' }, href: 'https://gumroad.com/library', target: '_blank' },
            'Cancel subscription'
          ),
          _react2.default.createElement(
            'p',
            null,
            _react2.default.createElement(
              'small',
              null,
              'We use ',
              _react2.default.createElement(
                'a',
                { href: 'https://gumroad.com', target: '_blank' },
                'gumroad.com'
              ),
              ' to mange jsreportonline payments and subscriptions. If you have any issues with payments, please contact gumroad support.',
              _react2.default.createElement('br', null),
              ' If the plan upgrade is not propagated after several minutes, please contact jsreport support.',
              _react2.default.createElement('br', null),
              _react2.default.createElement('br', null),
              _react2.default.createElement(
                'b',
                null,
                'Please cancel the old subscription when upgrading between payed plans.'
              )
            )
          )
        ),
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'h2',
            null,
            'billing history'
          ),
          _react2.default.createElement(
            'table',
            { className: 'table' },
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
              _jsreportStudio2.default.authentication.user.billingHistory.map(function (item, index) {
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
                    Math.round(item.creditsUsed / 1000)
                  )
                );
              })
            )
          )
        )
      );
    }
  }]);

  return ReportEditor;
}(_react.Component);

exports.default = ReportEditor;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UpgradePlanModal = function (_Component) {
  _inherits(UpgradePlanModal, _Component);

  function UpgradePlanModal() {
    _classCallCheck(this, UpgradePlanModal);

    return _possibleConstructorReturn(this, (UpgradePlanModal.__proto__ || Object.getPrototypeOf(UpgradePlanModal)).apply(this, arguments));
  }

  _createClass(UpgradePlanModal, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { style: { width: '710px', height: '640px' } },
        _react2.default.createElement('iframe', { src: '/gumroad.html', style: { width: '100%', height: '100%' }, frameBorder: '0' })
      );
    }
  }]);

  return UpgradePlanModal;
}(_react.Component);

UpgradePlanModal.propTypes = {
  close: _react.PropTypes.func.isRequired,
  options: _react.PropTypes.object.isRequired
};
exports.default = UpgradePlanModal;

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = Studio.libraries['superagent'];

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _jsreportStudio = __webpack_require__(0);

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
        Math.round(_jsreportStudio2.default.authentication.user.creditsUsed / 1000),
        ' / ',
        _jsreportStudio2.default.authentication.user.creditsAvailable
      );
    }
  }]);

  return ReportsButton;
}(_react.Component);

exports.default = ReportsButton;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ChangePasswordModal = __webpack_require__(8);

var _ChangePasswordModal2 = _interopRequireDefault(_ChangePasswordModal);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (props) {
  return _jsreportStudio2.default.authentication.user.isAdmin ? React.createElement(
    'div',
    null,
    React.createElement(
      'a',
      {
        id: 'changePassword',
        onClick: function onClick() {
          return _jsreportStudio2.default.openModal(_ChangePasswordModal2.default, { entity: _jsreportStudio2.default.authentication.user });
        },
        style: { cursor: 'pointer' } },
      React.createElement('i', { className: 'fa fa-key' }),
      ' Change password'
    )
  ) : React.createElement('div', null);
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ChangePasswordModal = function (_Component) {
  _inherits(ChangePasswordModal, _Component);

  function ChangePasswordModal() {
    _classCallCheck(this, ChangePasswordModal);

    var _this = _possibleConstructorReturn(this, (ChangePasswordModal.__proto__ || Object.getPrototypeOf(ChangePasswordModal)).call(this));

    _this.state = {};
    return _this;
  }

  _createClass(ChangePasswordModal, [{
    key: 'changePassword',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var close, data, response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                close = this.props.close;
                _context.prev = 1;
                data = {
                  newPassword: this.refs.newPassword1.value,
                  oldPassword: this.refs.oldPassword.value
                };
                _context.next = 5;
                return _jsreportStudio2.default.api.post('/api/password', { data: data });

              case 5:
                response = _context.sent;


                this.refs.newPassword1.value = '';
                this.refs.newPassword2.value = '';

                if (!(response.code !== 'ok')) {
                  _context.next = 11;
                  break;
                }

                this.setState({ validationError: response.code });
                return _context.abrupt('return');

              case 11:

                close();
                _context.next = 17;
                break;

              case 14:
                _context.prev = 14;
                _context.t0 = _context['catch'](1);

                this.setState({ apiError: _context.t0.message });

              case 17:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 14]]);
      }));

      function changePassword() {
        return _ref.apply(this, arguments);
      }

      return changePassword;
    }()
  }, {
    key: 'validatePassword',
    value: function validatePassword() {
      this.setState({
        passwordError: this.refs.newPassword2.value && this.refs.newPassword2.value !== this.refs.newPassword1.value,
        apiError: null
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'label',
            null,
            'old password'
          ),
          _react2.default.createElement('input', { type: 'password', ref: 'oldPassword' })
        ),
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'label',
            null,
            'new password'
          ),
          _react2.default.createElement('input', { type: 'password', ref: 'newPassword1' })
        ),
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'label',
            null,
            'new password verification'
          ),
          _react2.default.createElement('input', { type: 'password', ref: 'newPassword2', onChange: function onChange() {
              return _this2.validatePassword();
            } })
        ),
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'span',
            { style: { color: 'red', display: this.state.validationError ? 'block' : 'none' } },
            this.state.validationError
          ),
          _react2.default.createElement(
            'span',
            { style: { color: 'red', display: this.state.passwordError ? 'block' : 'none' } },
            'password doesn\'t match'
          ),
          _react2.default.createElement(
            'span',
            { style: { color: 'red', display: this.state.apiError ? 'block' : 'none' } },
            this.state.apiError
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'button-bar' },
          _react2.default.createElement(
            'button',
            { className: 'button confirmation', onClick: function onClick() {
                return _this2.changePassword();
              } },
            'ok'
          )
        )
      );
    }
  }]);

  return ChangePasswordModal;
}(_react.Component);

ChangePasswordModal.propTypes = {
  close: _react.PropTypes.func.isRequired,
  options: _react.PropTypes.object.isRequired
};
exports.default = ChangePasswordModal;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ChangeEmailModal = __webpack_require__(10);

var _ChangeEmailModal2 = _interopRequireDefault(_ChangeEmailModal);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (props) {
  return _jsreportStudio2.default.authentication.user.isAdmin ? React.createElement(
    'div',
    null,
    React.createElement(
      'a',
      {
        id: 'changeEmail',
        onClick: function onClick() {
          return _jsreportStudio2.default.openModal(_ChangeEmailModal2.default, { entity: _jsreportStudio2.default.authentication.user });
        },
        style: { cursor: 'pointer' } },
      React.createElement('i', { className: 'fa fa-at' }),
      ' Change email'
    )
  ) : React.createElement('div', null);
};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ChangeEmailModal = function (_Component) {
  _inherits(ChangeEmailModal, _Component);

  function ChangeEmailModal() {
    _classCallCheck(this, ChangeEmailModal);

    var _this = _possibleConstructorReturn(this, (ChangeEmailModal.__proto__ || Object.getPrototypeOf(ChangeEmailModal)).call(this));

    _this.state = { loading: false, completed: false };
    return _this;
  }

  _createClass(ChangeEmailModal, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (this.refs.newEmail) {
        this.refs.newEmail.focus();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (this.completed) {
        window.location.reload();
      }
    }
  }, {
    key: 'changeEmail',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var data, response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                data = {
                  newEmail: this.refs.newEmail.value
                };


                this.setState({ loading: true });

                _context.next = 5;
                return _jsreportStudio2.default.api.post('/api/account-email', { data: data });

              case 5:
                response = _context.sent;


                this.setState({ loading: false });

                this.refs.newEmail.value = '';

                if (!(response.code !== 'ok')) {
                  _context.next = 11;
                  break;
                }

                this.setState({ validationError: response.code });
                return _context.abrupt('return');

              case 11:

                this.setState({ completed: true });
                this.completed = true;
                _context.next = 18;
                break;

              case 15:
                _context.prev = 15;
                _context.t0 = _context['catch'](0);

                this.setState({ loading: false, apiError: _context.t0.message });

              case 18:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 15]]);
      }));

      function changeEmail() {
        return _ref.apply(this, arguments);
      }

      return changeEmail;
    }()
  }, {
    key: 'confirm',
    value: function confirm() {
      var close = this.props.close;


      close();
      window.location.reload();
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var close = this.props.close;
      var _state = this.state,
          loading = _state.loading,
          completed = _state.completed;


      if (completed) {
        return _react2.default.createElement(
          'div',
          { key: 'info' },
          _react2.default.createElement(
            'div',
            { className: 'form-group' },
            _react2.default.createElement(
              'i',
              null,
              'Email changed successfully. Now we need to reload the studio..'
            )
          ),
          _react2.default.createElement(
            'div',
            { className: 'button-bar' },
            _react2.default.createElement(
              'button',
              { autoFocus: true, className: 'button confirmation', onClick: function onClick() {
                  return _this2.confirm();
                } },
              'Ok'
            )
          )
        );
      }

      return _react2.default.createElement(
        'div',
        { key: 'edit' },
        _react2.default.createElement(
          'p',
          null,
          'Please understand the change of the administrator email can break your API calls in case you use it in the authorization header. In this case, we recommend creating a custom jsreport user and use it in the API calls instead.'
        ),
        _react2.default.createElement(
          'p',
          null,
          'Afterward, it is safe to change the administrator email.'
        ),
        _react2.default.createElement(
          'p',
          null,
          'Please note that after the email is changed, you will be logged out and log in will be required.'
        ),
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'label',
            null,
            'current email'
          ),
          _react2.default.createElement(
            'span',
            null,
            _react2.default.createElement(
              'b',
              null,
              _jsreportStudio2.default.authentication.user.username
            )
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'label',
            null,
            'new email'
          ),
          _react2.default.createElement('input', { type: 'email', ref: 'newEmail', onFocus: function onFocus() {
              return _this2.setState({ validationError: null, apiError: null });
            } })
        ),
        _react2.default.createElement(
          'div',
          { className: 'form-group' },
          _react2.default.createElement(
            'span',
            { style: { color: 'red', display: this.state.validationError ? 'block' : 'none' } },
            this.state.validationError
          ),
          _react2.default.createElement(
            'span',
            { style: { color: 'red', display: this.state.apiError ? 'block' : 'none' } },
            this.state.apiError
          )
        ),
        _react2.default.createElement(
          'div',
          { className: 'button-bar' },
          _react2.default.createElement(
            'button',
            { className: 'button danger', disabled: loading, onClick: function onClick() {
                return _this2.changeEmail();
              } },
            'Save'
          ),
          _react2.default.createElement(
            'button',
            { className: 'button confirmation', disabled: loading, onClick: function onClick() {
                return close();
              } },
            'Cancel'
          )
        )
      );
    }
  }]);

  return ChangeEmailModal;
}(_react.Component);

ChangeEmailModal.propTypes = {
  close: _react.PropTypes.func.isRequired,
  options: _react.PropTypes.object.isRequired
};
exports.default = ChangeEmailModal;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var logo = 'data:image/png;base64,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';

var AboutModal = function (_Component) {
  _inherits(AboutModal, _Component);

  function AboutModal() {
    _classCallCheck(this, AboutModal);

    return _possibleConstructorReturn(this, (AboutModal.__proto__ || Object.getPrototypeOf(AboutModal)).apply(this, arguments));
  }

  _createClass(AboutModal, [{
    key: 'render',
    value: function render() {
      var extensions = this.props.options.extensions;
      var _extensions$jo$option = extensions.jo.options,
          version = _extensions$jo$option.version,
          jsreportVersion = _extensions$jo$option.jsreportVersion;


      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'h2',
          null,
          'About'
        ),
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement('img', { src: logo, style: { width: '100px', height: 'auto', marginBottom: '15px' } })
        ),
        _react2.default.createElement(
          'div',
          null,
          'jsreportonline version: ',
          _react2.default.createElement(
            'b',
            null,
            version
          )
        ),
        _react2.default.createElement(
          'div',
          null,
          'jsreport version: ',
          _react2.default.createElement(
            'b',
            null,
            jsreportVersion
          )
        ),
        _react2.default.createElement('br', null),
        _react2.default.createElement('br', null),
        _react2.default.createElement(
          'div',
          null,
          'See more information about the jsreportonline release process and also release notes'
        ),
        _react2.default.createElement('br', null),
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'a',
            {
              className: 'button confirmation',
              href: 'https://jsreport.net/learn/online-versions',
              target: '_blank',
              style: { marginLeft: 0 }
            },
            'jsreportonline releases'
          )
        )
      );
    }
  }]);

  return AboutModal;
}(_react.Component);

AboutModal.propTypes = {
  options: _react.PropTypes.object.isRequired
};
exports.default = AboutModal;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WindowsDeprecationModal = function (_Component) {
  _inherits(WindowsDeprecationModal, _Component);

  function WindowsDeprecationModal() {
    _classCallCheck(this, WindowsDeprecationModal);

    return _possibleConstructorReturn(this, (WindowsDeprecationModal.__proto__ || Object.getPrototypeOf(WindowsDeprecationModal)).apply(this, arguments));
  }

  _createClass(WindowsDeprecationModal, [{
    key: 'render',
    value: function render() {
      var templates = this.props.options.templates;


      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'p',
          null,
          'The windows based rendering is deprecated and will be removed in the future.'
        ),
        _react2.default.createElement(
          'p',
          null,
          'Please read more information ',
          _react2.default.createElement(
            'a',
            { target: '_blank', href: 'https://jsreport.net/learn/online-faq#windows-recipes' },
            'here'
          )
        ),
        templates && _react2.default.createElement(
          'div',
          null,
          'The following templates are affected',
          _react2.default.createElement(
            'ul',
            null,
            templates.map(function (t) {
              return _react2.default.createElement(
                'li',
                { key: t._id },
                _jsreportStudio2.default.resolveEntityPath(t)
              );
            })
          )
        )
      );
    }
  }]);

  return WindowsDeprecationModal;
}(_react.Component);

WindowsDeprecationModal.propTypes = {
  close: _react.PropTypes.func.isRequired,
  options: _react.PropTypes.object.isRequired
};
exports.default = WindowsDeprecationModal;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(1);

var _react2 = _interopRequireDefault(_react);

var _jsreportStudio = __webpack_require__(0);

var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ContactEmailModal = function (_Component) {
  _inherits(ContactEmailModal, _Component);

  function ContactEmailModal(props) {
    _classCallCheck(this, ContactEmailModal);

    var _this = _possibleConstructorReturn(this, (ContactEmailModal.__proto__ || Object.getPrototypeOf(ContactEmailModal)).call(this, props));

    _this.state = {
      validationError: null,
      apiError: null
    };
    return _this;
  }

  _createClass(ContactEmailModal, [{
    key: 'saveContactEmail',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var close, data, response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                close = this.props.close;
                _context.prev = 1;
                data = {
                  contactEmail: this.refs.contactEmail.value
                };
                _context.next = 5;
                return _jsreportStudio2.default.api.post('/api/register-contact-email', { data: data });

              case 5:
                response = _context.sent;


                this.refs.contactEmail.value = '';

                if (!(response.code !== 'ok')) {
                  _context.next = 10;
                  break;
                }

                this.setState({ validationError: response.code });
                return _context.abrupt('return');

              case 10:

                close();
                _context.next = 16;
                break;

              case 13:
                _context.prev = 13;
                _context.t0 = _context['catch'](1);

                this.setState({ apiError: _context.t0.message });

              case 16:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 13]]);
      }));

      function saveContactEmail() {
        return _ref.apply(this, arguments);
      }

      return saveContactEmail;
    }()
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'p',
          null,
          'We need to have a contact email in case of any notification about the service or to communicate directly if necessary.',
          _react2.default.createElement('br', null),
          'Please provide the email of the person who is in charge of any use of the service'
        ),
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'div',
            { className: 'form-group' },
            _react2.default.createElement(
              'label',
              null,
              'Contact Email'
            ),
            _react2.default.createElement('input', { type: 'text', placeholder: 'email...', ref: 'contactEmail' })
          ),
          _react2.default.createElement(
            'div',
            { className: 'form-group' },
            _react2.default.createElement(
              'span',
              { style: { color: 'red', display: this.state.validationError ? 'block' : 'none' } },
              this.state.validationError
            ),
            _react2.default.createElement(
              'span',
              { style: { color: 'red', display: this.state.apiError ? 'block' : 'none' } },
              this.state.apiError
            )
          ),
          _react2.default.createElement(
            'div',
            { className: 'button-bar' },
            _react2.default.createElement(
              'button',
              { className: 'button confirmation', onClick: function onClick() {
                  return _this2.saveContactEmail();
                } },
              'save'
            )
          )
        )
      );
    }
  }]);

  return ContactEmailModal;
}(_react.Component);

ContactEmailModal.propTypes = {
  close: _react.PropTypes.func.isRequired,
  options: _react.PropTypes.object.isRequired
};
exports.default = ContactEmailModal;

/***/ })
/******/ ]);