'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.__RewireAPI__ = exports.__ResetDependency__ = exports.__set__ = exports.__Rewire__ = exports.__GetDependency__ = exports.__get__ = exports.is$$ = exports.wdioSync = exports.executeAsync = exports.executeSync = exports.executeHooksWithArgs = exports.runInFiberContext = exports.wrapCommands = exports.wrapCommand = undefined;

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _setPrototypeOf = require('babel-runtime/core-js/object/set-prototype-of');

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _future = require('fibers/future');

var _future2 = _interopRequireDefault(_future);

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Fiber = require('fibers'); // ToDo fix unit test to work with imports

var SYNC_COMMANDS = ['domain', '_events', '_maxListeners', 'setMaxListeners', 'emit', 'addListener', 'on', 'once', 'removeListener', 'removeAllListeners', 'listeners', 'getMaxListeners', 'listenerCount', 'getPrototype'];

var STACKTRACE_FILTER = /((wdio-sync\/)*(build\/index.js|node_modules\/fibers)|- - - - -)/g;
var STACKTRACE_FILTER_FN = function STACKTRACE_FILTER_FN(e) {
    return !e.match(_get__('STACKTRACE_FILTER'));
};

var commandIsRunning = false;
var forcePromises = false;

/**
 * helpers
 */
var isAsync = function isAsync() {
    if (!global.browser || !global.browser.options) {
        return true;
    }

    return global.browser.options.sync === false;
};

var isElements = function isElements(result) {
    return typeof result.selector === 'string' && Array.isArray(result.value) && result.value.length && typeof result.value[0].ELEMENT !== 'undefined';
};

var is$$ = function is$$(result) {
    return Array.isArray(result) && !!result.length && !!result[0] && result[0].ELEMENT !== undefined;
};

var sanitizeErrorMessage = function sanitizeErrorMessage(e) {
    var stack = e.stack.split(/\n/g);
    var errorMsg = stack.shift();
    var cwd = process.cwd();

    /**
     * filter out stack traces to wdio-sync and fibers
     * and transform absolute path to relative
     */
    stack = stack.filter(_get__('STACKTRACE_FILTER_FN'));
    stack = stack.map(function (e) {
        return '    ' + e.replace(cwd + '/', '').trim();
    });

    /**
     * error stack can be empty when test execution is aborted and
     * the application is not running
     */
    var errorLine = 'unknown error line';
    if (stack && stack.length) {
        errorLine = stack.shift().trim();
    }

    /**
     * correct error occurence
     */
    var lineToFix = stack[stack.length - 1];
    if (lineToFix && lineToFix.indexOf('index.js') > -1) {
        stack[stack.length - 1] = lineToFix.slice(0, lineToFix.indexOf('index.js')) + errorLine;
    } else {
        stack.unshift('    ' + errorLine);
    }

    /**
     * add back error message
     */
    stack.unshift(errorMsg);

    return stack.join('\n');
};

// filter out arguments passed to specFn & hookFn, don't allow callbacks
// as there is no need for user to call e.g. `done()`
var filterSpecArgs = function filterSpecArgs(args) {
    return args.filter(function (arg) {
        return typeof arg !== 'function';
    });
};

/**
 * Helper method to execute a row of hooks with certain parameters.
 * It will return with a reject promise due to a design decision to not let hooks/service intefer the
 * actual test process.
 *
 * @param  {Function|Function[]} hooks  list of hooks
 * @param  {Object[]} args  list of parameter for hook functions
 * @return {Promise}  promise that gets resolved once all hooks finished running
 */
var executeHooksWithArgs = function executeHooksWithArgs() {
    var hooks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var args = arguments[1];

    /**
     * make sure hooks are an array of functions
     */
    if (typeof hooks === 'function') {
        hooks = [hooks];
    }

    /**
     * make sure args is an array since we are calling apply
     */
    if (!Array.isArray(args)) {
        args = [args];
    }

    hooks = hooks.map(function (hook) {
        return new _promise2.default(function (resolve) {
            var _commandIsRunning = _get__('commandIsRunning');
            var result = void 0;

            var execHook = function execHook() {
                _assign__('commandIsRunning', true);

                try {
                    result = hook.apply(null, args);
                } catch (e) {
                    console.error(e.stack);
                    return resolve(e);
                } finally {
                    _assign__('commandIsRunning', _commandIsRunning);
                }
                if (result && typeof result.then === 'function') {
                    return result.then(resolve, function (e) {
                        console.error(e.stack);
                        resolve(e);
                    });
                }

                resolve(result);
            };

            /**
             * no need for fiber wrap in async mode
             */
            if (_get__('isAsync')()) {
                return execHook();
            }

            /**
             * after command hooks require additional Fiber environment
             */
            return _get__('Fiber')(execHook).run();
        });
    });

    return _promise2.default.all(hooks);
};

/**
 * global function to wrap callbacks into Fiber context
 * @param  {Function} fn  function to wrap around
 * @return {Function}     wrapped around function
 */
var wdioSync = global.wdioSync = function (fn, done) {
    return function () {
        var _this = this;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _get__('Fiber')(function () {
            var result = fn.apply(_this, args);

            if (typeof done === 'function') {
                done(result);
            }
        }).run();
    };
};

/**
 * wraps a function into a Fiber ready context to enable sync execution and hooks
 * @param  {Function}   fn             function to be executed
 * @param  {String}     commandName    name of that function
 * @param  {Function[]} beforeCommand  method to be executed before calling the actual function
 * @param  {Function[]} afterCommand   method to be executed after calling the actual function
 * @return {Function}   actual wrapped function
 */
var wrapCommand = function wrapCommand(fn, commandName, beforeCommand, afterCommand) {
    if (_get__('isAsync')()) {
        /**
         * async command wrap
         */
        return function () {
            for (var _len2 = arguments.length, commandArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                commandArgs[_key2] = arguments[_key2];
            }

            return fn.apply(this, commandArgs);
        };
    }

    /**
     * sync command wrap
     */
    return function () {
        var _this2 = this;

        for (var _len3 = arguments.length, commandArgs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            commandArgs[_key3] = arguments[_key3];
        }

        var future = new (_get__('Future'))();
        var futureFailed = false;

        if (_get__('forcePromises')) {
            return fn.apply(this, commandArgs);
        }

        /**
         * don't execute [before/after]Command hook if a command was executed
         * in these hooks (otherwise we will get into an endless loop)
         */
        if (_get__('commandIsRunning')) {
            var commandPromise = fn.apply(this, commandArgs);

            /**
             * if commandPromise is actually not a promise just return result
             */
            if (typeof commandPromise.then !== 'function') {
                return commandPromise;
            }

            /**
             * Try to execute with Fibers and fall back if can't.
             * This part is executed when we want to set a fiber context within a command (e.g. in waitUntil).
             */
            try {
                commandPromise.then(function (commandResult) {
                    /**
                     * extend protoype of result so people can call browser.element(...).click()
                     */
                    future.return(_get__('applyPrototype').call(_this2, commandResult));
                }, future.throw.bind(future));
                return future.wait();
            } catch (e) {
                if (e.message === "Can't wait without a fiber") {
                    return commandPromise;
                }
                throw e;
            }
        }

        /**
         * commands that get executed during waitUntil and debug (repl mode) should always
         * handled synchronously, therefor prevent propagating lastResults between single calls
         */
        if (commandName !== 'waitUntil' && commandName !== 'debug') {
            _assign__('commandIsRunning', true);
        }

        var newInstance = this;
        var lastCommandResult = this.lastResult;
        var commandResult = void 0,
            commandError = void 0;
        _get__('executeHooksWithArgs')(beforeCommand, [commandName, commandArgs]).then(function () {
            /**
             * actual function was already executed in desired catch block
             */
            if (futureFailed) {
                return;
            }

            newInstance = fn.apply(_this2, commandArgs);
            return newInstance.then(function (result) {
                commandResult = result;
                return _get__('executeHooksWithArgs')(afterCommand, [commandName, commandArgs, result]);
            }, function (e) {
                commandError = e;
                return _get__('executeHooksWithArgs')(afterCommand, [commandName, commandArgs, null, e]);
            }).then(function () {
                _assign__('commandIsRunning', false);

                if (commandError) {
                    return future.throw(commandError);
                }
                _get__('wrapCommands')(newInstance, beforeCommand, afterCommand);

                /**
                 * don't modify call result prototype
                 */
                if (commandName === 'call' || commandName === 'reload') {
                    return future.return(commandResult);
                }

                /**
                 * reset lastResult for all element calls within waitUntil/waitFor commands
                 */
                if (commandName.match(/^(waitUntil|waitFor)/i)) {
                    _this2.lastResult = lastCommandResult;
                }

                return future.return(_get__('applyPrototype').call(newInstance, commandResult));
            });
        });

        /**
         * try to execute with Fibers and fall back if can't
         */
        try {
            return future.wait();
        } catch (e) {
            if (e.message === "Can't wait without a fiber") {
                futureFailed = true;
                return fn.apply(this, commandArgs);
            }

            e.stack = _get__('sanitizeErrorMessage')(e);
            throw e;
        }
    };
};

/**
 * enhance result with instance prototype to enable command chaining
 * @param  {Object} result       command result
 * @param  {Object} helperScope  instance scope with prototype of already wrapped commands
 * @return {Object}              command result with enhanced prototype
 */
var applyPrototype = function applyPrototype(result, helperScope) {
    var _this3 = this;

    /**
     * don't overload result for none objects, arrays and buffer
     */
    if (!result || typeof result !== 'object' || Array.isArray(result) && !_get__('isElements')(result) && !_get__('is$$')(result) || Buffer.isBuffer(result)) {
        return result;
    }

    var mapPrototype = function mapPrototype(el) {
        var newInstance = (0, _setPrototypeOf2.default)((0, _create2.default)(el), (0, _getPrototypeOf2.default)(_this3));
        return _get__('applyPrototype').call(newInstance, el, _this3);
    };

    /**
     * overload elements results
     */
    if (_get__('isElements')(result)) {
        result.value = result.value.map(function (el, i) {
            el.selector = result.selector;
            el.value = { ELEMENT: el.ELEMENT };
            el.index = i;
            return el;
        }).map(mapPrototype);
    }

    /**
     * overload $$ result
     */
    if (_get__('is$$')(result)) {
        return result.map(mapPrototype);
    }

    var prototype = {};
    var hasExtendedPrototype = false;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = (0, _getIterator3.default)((0, _keys2.default)((0, _getPrototypeOf2.default)(this))), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var commandName = _step.value;

            if (result[commandName] || _get__('SYNC_COMMANDS').indexOf(commandName) > -1) {
                continue;
            }

            this.lastResult = result;

            /**
             * Prefer the helperScope if given which is only the case when we overload elements result.
             * We can't use the `this` prototype because its methods are not wrapped and command results
             * wouldn't be fiberised
             */
            prototype[commandName] = { value: (helperScope || this)[commandName].bind(this) };
            hasExtendedPrototype = true;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    if (hasExtendedPrototype) {
        var newResult = (0, _create2.default)(result, prototype);

        /**
         * since status is a command we need to rename the property
         */
        if (typeof result.status !== 'undefined') {
            result._status = result.status;
            delete result.status;
        }

        result = _get__('assign')(newResult, result);
    }

    return result;
};

/**
 * wraps all WebdriverIO commands
 * @param  {Object}     instance       WebdriverIO client instance (browser)
 * @param  {Function[]} beforeCommand  before command hook
 * @param  {Function[]} afterCommand   after command hook
 */
var wrapCommands = function wrapCommands(instance, beforeCommand, afterCommand) {
    var addCommand = instance.addCommand;

    /**
     * if instance is a multibrowser instance make sure to wrap commands
     * of its instances too
     */
    if (instance.isMultiremote) {
        instance.getInstances().forEach(function (browserName) {
            _get__('wrapCommands')(global[browserName], beforeCommand, afterCommand);
        });
    }

    (0, _keys2.default)((0, _getPrototypeOf2.default)(instance)).forEach(function (commandName) {
        if (_get__('SYNC_COMMANDS').indexOf(commandName) > -1) {
            return;
        }

        var origFn = instance[commandName];
        instance[commandName] = _get__('wrapCommand').call(instance, origFn, commandName, beforeCommand, afterCommand);
    });

    /**
     * no need to overwrite addCommand in async mode
     */
    if (_get__('isAsync')()) {
        return;
    }

    /**
     * Adding a command within fiber context doesn't require a special routine
     * since everything runs sync. There is no need to promisify the command.
     */
    instance.addCommand = function (fnName, fn, forceOverwrite) {
        var commandGroup = instance.getPrototype();
        var commandName = fnName;
        var namespace = void 0;

        if (typeof fn === 'string') {
            namespace = arguments[0];
            fnName = arguments[1];
            fn = arguments[2];
            forceOverwrite = arguments[3];

            switch (typeof commandGroup[namespace]) {
                case 'function':
                    throw new Error(`Command namespace "${namespace}" is used internally, and can't be overwritten!`);
                case 'undefined':
                    commandGroup[namespace] = {};
                    break;
            }

            commandName = `${namespace}.${fnName}`;
            commandGroup = commandGroup[namespace];
        }

        if (commandGroup[fnName] && !forceOverwrite) {
            throw new Error(`Command ${fnName} is already defined!`);
        }

        /**
         * If method name is async the user specifies that he wants to use bare promises to handle asynchronicity.
         * First use native addCommand in order to be able to chain with other native commands, then wrap new
         * command again to run it synchronous in the test method.
         * This will allow us to run async custom commands within sync custom commands in a sync way.
         */
        if (fn.name === 'async') {
            addCommand(fnName, function () {
                var state = _get__('forcePromises');
                _assign__('forcePromises', true);

                for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                    args[_key4] = arguments[_key4];
                }

                var res = fn.apply(instance, args);
                _assign__('forcePromises', state);
                return res;
            }, forceOverwrite);
            commandGroup[fnName] = _get__('wrapCommand').call(commandGroup, commandGroup[fnName], fnName, beforeCommand, afterCommand);
            return;
        }

        /**
         * for all other cases we internally return a promise that is
         * finished once the Fiber wrapped custom function has finished
         * #functionalProgrammingWTF!
         */
        commandGroup[fnName] = function () {
            var _this4 = this;

            for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                args[_key5] = arguments[_key5];
            }

            return new _promise2.default(function (resolve) {
                var state = _get__('forcePromises');
                _assign__('forcePromises', false);
                _get__('wdioSync')(fn, resolve).apply(_this4, args);
                _assign__('forcePromises', state);
            });
        };
        instance[fnName] = _get__('wrapCommand').call(commandGroup, commandGroup[fnName], commandName, beforeCommand, afterCommand);
    };
};

/**
 * execute test or hook synchronously
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   repeatTest number of retries
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
var executeSync = function executeSync(fn) {
    var _this5 = this;

    var repeatTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    /**
     * if a new hook gets executed we can assume that all commands should have finised
     * with exception of timeouts where `commandIsRunning` will never be reset but here
     */
    _assign__('commandIsRunning', false);

    return new _promise2.default(function (resolve, reject) {
        try {
            var res = fn.apply(_this5, args);
            resolve(res);
        } catch (e) {
            if (repeatTest) {
                return resolve(_get__('executeSync')(fn, --repeatTest, args));
            }

            /**
             * no need to modify stack if no stack available
             */
            if (!e.stack) {
                return reject(e);
            }

            e.stack = e.stack.split('\n').filter(_get__('STACKTRACE_FILTER_FN')).join('\n');
            reject(e);
        }
    });
};

/**
 * execute test or hook asynchronously
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   repeatTest number of retries
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
var executeAsync = function executeAsync(fn) {
    var repeatTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    var result = void 0,
        error = void 0;

    /**
     * if a new hook gets executed we can assume that all commands should have finised
     * with exception of timeouts where `commandIsRunning` will never be reset but here
     */
    _assign__('commandIsRunning', false);

    try {
        result = fn.apply(this, args);
    } catch (e) {
        error = e;
    }

    /**
     * handle errors that get thrown directly and are not cause by
     * rejected promises
     */
    if (error) {
        if (repeatTest) {
            return _get__('executeAsync')(fn, --repeatTest, args);
        }
        return new _promise2.default(function (resolve, reject) {
            return reject(error);
        });
    }

    /**
     * if we don't retry just return result
     */
    if (repeatTest === 0 || !result || typeof result.catch !== 'function') {
        return new _promise2.default(function (resolve) {
            return resolve(result);
        });
    }

    /**
     * handle promise response
     */
    return result.catch(function (e) {
        if (repeatTest) {
            return _get__('executeAsync')(fn, --repeatTest, args);
        }

        e.stack = e.stack.split('\n').filter(_get__('STACKTRACE_FILTER_FN')).join('\n');
        return _promise2.default.reject(e);
    });
};

/**
 * runs a hook within fibers context (if function name is not async)
 * it also executes before/after hook hook
 *
 * @param  {Function} hookFn      function that was passed to the framework hook
 * @param  {Function} origFn      original framework hook function
 * @param  {Function} before      before hook hook
 * @param  {Function} after       after hook hook
 * @param  {Number}   repeatTest  number of retries if hook fails
 * @return {Function}             wrapped framework hook function
 */
var runHook = function runHook(hookFn, origFn, before, after) {
    var repeatTest = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

    var hookError = function hookError(hookName) {
        return function (e) {
            return console.error(`Error in ${hookName}: ${e.stack}`);
        };
    };

    return origFn(function () {
        var _this6 = this;

        for (var _len6 = arguments.length, hookArgs = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
            hookArgs[_key6] = arguments[_key6];
        }

        // Print errors encountered in beforeHook and afterHook to console, but
        // don't propagate them to avoid failing the test. However, errors in
        // framework hook functions should fail the test, so propagate those.
        return _get__('executeHooksWithArgs')(before).catch(hookError('beforeHook')).then(function () {
            /**
             * user wants handle async command using promises, no need to wrap in fiber context
             */
            if (_get__('isAsync')() || hookFn.name === 'async') {
                return _get__('executeAsync').call(_this6, hookFn, repeatTest, _get__('filterSpecArgs')(hookArgs));
            }

            return new _promise2.default(_get__('runSync').call(_this6, hookFn, repeatTest, _get__('filterSpecArgs')(hookArgs)));
        }).then(function () {
            return _get__('executeHooksWithArgs')(after).catch(hookError('afterHook'));
        });
    });
};

/**
 * runs a spec function (test function) within the fibers context
 * @param  {string}   specTitle   test description
 * @param  {Function} specFn      test function that got passed in from the user
 * @param  {Function} origFn      original framework test function
 * @param  {Number}   repeatTest  number of retries if test fails
 * @return {Function}             wrapped test function
 */
var runSpec = function runSpec(specTitle, specFn, origFn) {
    var repeatTest = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

    /**
     * user wants handle async command using promises, no need to wrap in fiber context
     */
    if (_get__('isAsync')() || specFn.name === 'async') {
        return origFn(specTitle, function async() {
            for (var _len7 = arguments.length, specArgs = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                specArgs[_key7] = arguments[_key7];
            }

            return _get__('executeAsync').call(this, specFn, repeatTest, _get__('filterSpecArgs')(specArgs));
        });
    }

    return origFn(specTitle, function () {
        for (var _len8 = arguments.length, specArgs = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
            specArgs[_key8] = arguments[_key8];
        }

        return new _promise2.default(_get__('runSync').call(this, specFn, repeatTest, _get__('filterSpecArgs')(specArgs)));
    });
};

/**
 * run hook or spec via executeSync
 */
function runSync(fn) {
    var _this7 = this;

    var repeatTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    return function (resolve, reject) {
        return _get__('Fiber')(function () {
            return _get__('executeSync').call(_this7, fn, repeatTest, args).then(function () {
                return resolve();
            }, reject);
        }).run();
    };
}

/**
 * wraps hooks and test function of a framework within a fiber context
 * @param  {Function} origFn               original framework function
 * @param  {string[]} testInterfaceFnNames actual test functions for that framework
 * @return {Function}                      wrapped test/hook function
 */
var wrapTestFunction = function wrapTestFunction(fnName, origFn, testInterfaceFnNames, before, after) {
    return function () {
        for (var _len9 = arguments.length, specArguments = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
            specArguments[_key9] = arguments[_key9];
        }

        /**
         * Variadic arguments:
         * [title, fn], [title], [fn]
         * [title, fn, retryCnt], [title, retryCnt], [fn, retryCnt]
         */
        var retryCnt = typeof specArguments[specArguments.length - 1] === 'number' ? specArguments.pop() : 0;
        var specFn = typeof specArguments[0] === 'function' ? specArguments.shift() : typeof specArguments[1] === 'function' ? specArguments.pop() : undefined;
        var specTitle = specArguments[0];

        if (testInterfaceFnNames.indexOf(fnName) > -1) {
            if (specFn) return _get__('runSpec')(specTitle, specFn, origFn, retryCnt);

            /**
             * if specFn is undefined we are dealing with a pending function
             */
            return origFn(specTitle);
        }

        return _get__('runHook')(specFn, origFn, before, after, retryCnt);
    };
};

/**
 * Wraps global test function like `it` so that commands can run synchronouse
 *
 * The scope parameter is used in the qunit framework since all functions are bound to global.QUnit instead of global
 *
 * @param  {String[]} testInterfaceFnNames  command that runs specs
 * @param  {Function} before               before hook hook
 * @param  {Function} after                after hook hook
 * @param  {String}   fnName               test interface command to wrap
 * @param  {Object}   scope                the scope to run command from, defaults to global
 */
var runInFiberContext = function runInFiberContext(testInterfaceFnNames, before, after, fnName) {
    var scope = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : global;

    var origFn = scope[fnName];
    scope[fnName] = _get__('wrapTestFunction')(fnName, origFn, testInterfaceFnNames, before, after);

    /**
     * support it.skip for the Mocha framework
     */
    if (typeof origFn.skip === 'function') {
        scope[fnName].skip = origFn.skip;
    }

    /**
     * wrap it.only for the Mocha framework
     */
    if (typeof origFn.only === 'function') {
        var origOnlyFn = origFn.only;
        scope[fnName].only = _get__('wrapTestFunction')(fnName + '.only', origOnlyFn, testInterfaceFnNames, before, after);
    }
};

exports.wrapCommand = wrapCommand;
exports.wrapCommands = wrapCommands;
exports.runInFiberContext = runInFiberContext;
exports.executeHooksWithArgs = executeHooksWithArgs;
exports.executeSync = executeSync;
exports.executeAsync = executeAsync;
exports.wdioSync = wdioSync;
exports.is$$ = is$$;

function _getGlobalObject() {
    try {
        if (!!global) {
            return global;
        }
    } catch (e) {
        try {
            if (!!window) {
                return window;
            }
        } catch (e) {
            return this;
        }
    }
}

;
var _RewireModuleId__ = null;

function _getRewireModuleId__() {
    if (_RewireModuleId__ === null) {
        var globalVariable = _getGlobalObject();

        if (!globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__) {
            globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__ = 0;
        }

        _RewireModuleId__ = __$$GLOBAL_REWIRE_NEXT_MODULE_ID__++;
    }

    return _RewireModuleId__;
}

function _getRewireRegistry__() {
    var theGlobalVariable = _getGlobalObject();

    if (!theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__) {
        theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = (0, _create2.default)(null);
    }

    return __$$GLOBAL_REWIRE_REGISTRY__;
}

function _getRewiredData__() {
    var moduleId = _getRewireModuleId__();

    var registry = _getRewireRegistry__();

    var rewireData = registry[moduleId];

    if (!rewireData) {
        registry[moduleId] = (0, _create2.default)(null);
        rewireData = registry[moduleId];
    }

    return rewireData;
}

(function registerResetAll() {
    var theGlobalVariable = _getGlobalObject();

    if (!theGlobalVariable['__rewire_reset_all__']) {
        theGlobalVariable['__rewire_reset_all__'] = function () {
            theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = (0, _create2.default)(null);
        };
    }
})();

var INTENTIONAL_UNDEFINED = '__INTENTIONAL_UNDEFINED__';
var _RewireAPI__ = {};

(function () {
    function addPropertyToAPIObject(name, value) {
        (0, _defineProperty2.default)(_RewireAPI__, name, {
            value: value,
            enumerable: false,
            configurable: true
        });
    }

    addPropertyToAPIObject('__get__', _get__);
    addPropertyToAPIObject('__GetDependency__', _get__);
    addPropertyToAPIObject('__Rewire__', _set__);
    addPropertyToAPIObject('__set__', _set__);
    addPropertyToAPIObject('__reset__', _reset__);
    addPropertyToAPIObject('__ResetDependency__', _reset__);
    addPropertyToAPIObject('__with__', _with__);
})();

function _get__(variableName) {
    var rewireData = _getRewiredData__();

    if (rewireData[variableName] === undefined) {
        return _get_original__(variableName);
    } else {
        var value = rewireData[variableName];

        if (value === INTENTIONAL_UNDEFINED) {
            return undefined;
        } else {
            return value;
        }
    }
}

function _get_original__(variableName) {
    switch (variableName) {
        case 'STACKTRACE_FILTER':
            return STACKTRACE_FILTER;

        case 'STACKTRACE_FILTER_FN':
            return STACKTRACE_FILTER_FN;

        case 'commandIsRunning':
            return commandIsRunning;

        case 'isAsync':
            return isAsync;

        case 'Fiber':
            return Fiber;

        case 'Future':
            return _future2.default;

        case 'forcePromises':
            return forcePromises;

        case 'applyPrototype':
            return applyPrototype;

        case 'executeHooksWithArgs':
            return executeHooksWithArgs;

        case 'wrapCommands':
            return wrapCommands;

        case 'sanitizeErrorMessage':
            return sanitizeErrorMessage;

        case 'isElements':
            return isElements;

        case 'is$$':
            return is$$;

        case 'SYNC_COMMANDS':
            return SYNC_COMMANDS;

        case 'assign':
            return _object2.default;

        case 'wrapCommand':
            return wrapCommand;

        case 'wdioSync':
            return wdioSync;

        case 'executeSync':
            return executeSync;

        case 'executeAsync':
            return executeAsync;

        case 'filterSpecArgs':
            return filterSpecArgs;

        case 'runSync':
            return runSync;

        case 'runSpec':
            return runSpec;

        case 'runHook':
            return runHook;

        case 'wrapTestFunction':
            return wrapTestFunction;
    }

    return undefined;
}

function _assign__(variableName, value) {
    var rewireData = _getRewiredData__();

    if (rewireData[variableName] === undefined) {
        return _set_original__(variableName, value);
    } else {
        return rewireData[variableName] = value;
    }
}

function _set_original__(variableName, _value) {
    switch (variableName) {
        case 'commandIsRunning':
            return commandIsRunning = _value;

        case 'forcePromises':
            return forcePromises = _value;
    }

    return undefined;
}

function _update_operation__(operation, variableName, prefix) {
    var oldValue = _get__(variableName);

    var newValue = operation === '++' ? oldValue + 1 : oldValue - 1;

    _assign__(variableName, newValue);

    return prefix ? newValue : oldValue;
}

function _set__(variableName, value) {
    var rewireData = _getRewiredData__();

    if (typeof variableName === 'object') {
        (0, _keys2.default)(variableName).forEach(function (name) {
            rewireData[name] = variableName[name];
        });
    } else {
        if (value === undefined) {
            rewireData[variableName] = INTENTIONAL_UNDEFINED;
        } else {
            rewireData[variableName] = value;
        }

        return function () {
            _reset__(variableName);
        };
    }
}

function _reset__(variableName) {
    var rewireData = _getRewiredData__();

    delete rewireData[variableName];

    if ((0, _keys2.default)(rewireData).length == 0) {
        delete _getRewireRegistry__()[_getRewireModuleId__];
    }

    ;
}

function _with__(object) {
    var rewireData = _getRewiredData__();

    var rewiredVariableNames = (0, _keys2.default)(object);
    var previousValues = {};

    function reset() {
        rewiredVariableNames.forEach(function (variableName) {
            rewireData[variableName] = previousValues[variableName];
        });
    }

    return function (callback) {
        rewiredVariableNames.forEach(function (variableName) {
            previousValues[variableName] = rewireData[variableName];
            rewireData[variableName] = object[variableName];
        });
        var result = callback();

        if (!!result && typeof result.then == 'function') {
            result.then(reset).catch(reset);
        } else {
            reset();
        }

        return result;
    };
}

exports.__get__ = _get__;
exports.__GetDependency__ = _get__;
exports.__Rewire__ = _set__;
exports.__set__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.__RewireAPI__ = _RewireAPI__;
exports.default = _RewireAPI__;