/**
 * @file
 * ABTest.js
 *
 * Simple A/B Test library.
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://code.google.com/p/abtest-js/wiki/License
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to aldo.armiento@gmail.com so we can send you a copy immediately.
 *
 * @see http://code.google.com/p/abtest-js/
 * @author (C) 2010 Aldo Armiento (aldo.armiento@gmail.com)
 * @author Sponsored by Gruppo Immobiliare.it S.r.l. (http://www.immobiliare.it/)
 * @version $Id$
 */
if (typeof ABTest == 'undefined') {
	var ABTest = new function () {

		const COOKIE_PREFIX = 'ABTest_'; /**< @type String Cookie prefix. */

		const NOW = new Date().getTime(); /**< @type Number Current timestamp. */

		const TEST_SESSION = { hours: 48 }; /**< @type object Default test session duration. */
		const MAX_TEST_SESSION = { days: 7 }; /**< @type object Default maximum test session duration. */

		var _logEnabled = false; /**< @type Boolean True to enable event log, false otherwise. */
		var _luckiness = false; /**< @type Boolean True if user is lucky, false otherwise. */

		var _running = false; /**< @type Boolean Test is running and can not be re-executed. */
		var _testName; /**< @type String Current A/B Test name. */
		var _testOptions = {}; /**< @type object Current A/B Test options. */

		var _allTests = new Array(); /**< @type Array All loaded tests. */

		/**
		 * Starts the A/B Test.
		 *
		 * @param  name @type String The test name.
		 * @param  options @type object Test options:
		 *		   @li @c session (optional, default TEST_SESSION) Session duration
		 *		   @li @c maxSession (optional, default MAX_TEST_SESSION) Session max duration
		 *		   @li @c probability User lucky/unlucky probability
		 *		   @li @c path (optional, default /) Site path validity (cookie path)
		 *		   @li @c domain (optional, default empty) Site domain validity (cookie domain)
		 *		   @li @c secure (optional, default false) Use https protocol (cookie secure)
		 *		   @li @c test Specific test options (test must exists)
		 */
		this.start = function (name, options) {
			if (_running) {
				_error('An A/B test is already running, exiting.');
				return;
			}
			_running = true;

			if (!name || !options) {
				_error('Wrong number or type of arguments.');
				return;
			}
			options = options || {};

			options.test = options.test || {};
			if (!options.test.name) {
				_error('No test name specified.');
				return;
			}

			if (typeof _allTests[options.test.name] != 'function') {
				_error("Test '" + options.test.name + "' does not loaded.");
				return;
			}

			options.session = options.session || TEST_SESSION;
			options.maxSession = options.maxSession || MAX_TEST_SESSION;

			options.probability = options.probability || 0;
			options.path = options.path || '/';
			options.domain = options.domain || '';
			options.secure = options.secure || false;

			_testName = name;
			_testOptions = options;

			_log('Starting A/B test ' + name + '.');

			if (_userSession()) {
				_runTest();
			}
		}

		/**
		 * Enable/disable log.
		 *
		 * @param  logEnabled @type Boolean True to enable logging functions.
		 */
		this.enableLog = function (logEnabled) {
			_logEnabled = logEnabled;
		}

		/**
		 * Enable/disable log.
		 *
		 * @return @type Boolean True if the current user is lucky.
		 */
		this.isUserLucky = function () {
			return _luckiness;
		}

		/**
		 * Adds custom test.
		 *
		 * @param  testFunction @type Function Test function.
		 */
		this.addTest = function (testFunction) {
			var testName = testFunction.name;

			if (!testName) {
				_error('The test function must have a name that is the test name.');
				return;
			}
			if (_allTests[testName]) {
				_error("The test '" + testName + "' already exists.");
				return false;
			}
			_allTests[testName] = testFunction;
			return true;
		}

		/**
		 * Returns A/B Test name.
		 *
		 * @return @type String A/B Test name.
		 */
		this.getTestName = function () {
			return _testName;
		}

		/**
		 * Returns A/B Test configuration options.
		 *
		 * @return @type Object A/B Test options.
		 */
		this.getTestOptions = function () {
			return _testOptions;
		}

		/**
		 * Tests if a cookie exists.
		 *
		 * @param  name @type String Cookie name
		 * @return @type Boolean True if cookie esists, false otherwise.
		 */
		this.cookieExists = function (name) {
			return typeof _getCookie(COOKIE_PREFIX + _testName + '_' + name) != 'undefined';
		}

		/**
		 * Get a cookie value by name.
		 *
		 * @param  name @type String Cookie name
		 * @return @type String The cookie value or undefined if no cookie
		 *		   exists with that name.
		 */
		this.getCookie = function (name) {
			return _getCookie(COOKIE_PREFIX + _testName + '_' + name);
		}

		/**
		 * Setup a new session only cookie or updates an existing cookie with the
		 * same name.
		 *
		 * @param  name @type String Cookie name.
		 * @param  value @type String Cookie value.
		 */
		this.setCookieSession = function (name, value) {
			_setCookie(COOKIE_PREFIX + _testName + '_' + name, value, null,
				_testOptions.path, _testOptions.domain, _testOptions.secure);
		}

		/**
		 * Delete a new session only cookie.
		 *
		 * @param  name @type String Cookie name.
		 */
		this.deleteCookieSession = function (name) {
			_setCookie(COOKIE_PREFIX + _testName + '_' + name, '', new Date(),
				_testOptions.path, _testOptions.domain, _testOptions.secure);
		}

		/**
		 * Runs current test.
		 */
		function _runTest() {
			_allTests[_testOptions.test.name](
				_testOptions.test, {log: _log, error: _error});
		}

		/**
		 * Manages test cookie (creation and expiration) and, if cookie does not
		 * exists, draws the user.
		 *
		 * @return @type Boolean True if cookies are supported, false otherwise.
		 */
		function _userSession() {
			var cookieValue = _getCookie(COOKIE_PREFIX + _testName);
			var cookieValues = cookieValue ? cookieValue.split(';') :
				new Array(NOW, _drawUser(_testOptions.probability));
			cookieValue = cookieValues.join(';');

			var drawTime = parseInt(cookieValues[0]) || 0;
			var wasUserLucky = _luckiness = parseInt(cookieValues[1]) > 0;

			_log('The user has been drawn on '+ new Date(drawTime) +
				(drawTime == NOW ? ' (just now!)' : '') + ' and was ' +
				(wasUserLucky ? '' : 'un') + 'lucky.');

			var expirationDate = NOW - drawTime <= _getTime(_testOptions.maxSession) ?
				new Date(NOW + _getTime(_testOptions.session)) : null;

			_log('The user has' + (expirationDate ? ' not' : '') +
				' reached maxSession. Cookie expiration date is ' +
				(expirationDate ? expirationDate : 'at the end of the current session.'));

			_setCookie(COOKIE_PREFIX + _testName, cookieValue,
				expirationDate, _testOptions.path, _testOptions.domain, _testOptions.secure);

			return _getCookie(COOKIE_PREFIX + _testName) == cookieValue;
		}

		/**
		 * Draws an user.
		 *
		 * @param  probability @type Number Probability percentage (range 0..100).
		 * @return @type Number In range 0..1 0 => User is unlucky, 1 => User is lucky.
		 */
		function _drawUser(probability) {
			var isUserLucky = !Math.floor(Math.random() * 100 / probability);
			_log('Is current user lucky? Probability is ' + probability + '%... ' +
				(isUserLucky ? 'Yes!' : 'No!'));
			return new Number(isUserLucky);
		}

		/**
		 * Converts a duration object to a microseconds time.
		 *
		 * @param  duration @type object Duration object:
		 *		   @li @c days/day Day(s) amount
		 *		   @li @c hours/hour Hour(s) amount
		 *		   @li @c minutes/minute Minute(s) amount
		 * @return @type Number Duration in microseconds.
		 */
		function _getTime(duration) {
			const MIN = 60 * 1000;
			const HOUR = 60 * MIN;
			const DAY = 24 * HOUR;
			duration = duration || {};
			return (duration.days	 || 0) * DAY +
				   (duration.day	 || 0) * DAY +
				   (duration.hours	 || 0) * HOUR +
				   (duration.hour	 || 0) * HOUR +
				   (duration.minutes || 0) * MIN +
				   (duration.minute	 || 0) * MIN;
		}

		/**
		 * Get a cookie value by name.
		 *
		 * @param  name @type String Cookie name
		 * @return @type String The cookie value or undefined if no cookie
		 *		   exists with that name.
		 */
		function _getCookie(name) {
			var documentCookies = document.cookie.split(';');
			if (!documentCookies.length) {
				_log('No cookies exists.');
				return;
			}
			for (var i = 0; i < documentCookies.length; i++) {
				var currentCookie = documentCookies[i].split('=');
				if (currentCookie[0].trim() != name.trim()) {
					continue;
				}
				var cookieValue = unescape(currentCookie[1].trim());
				_log('Cookie name: ' + name + ' - Cookie value: ' + cookieValue);
				return cookieValue;
			}
			_log('Cookie ' + name + ' does not exists.');
		}

		/**
		 * Setup a new cookie or updates an existing cookie with the same name.
		 *
		 * @param  name @type String Cookie name.
		 * @param  value @type String Cookie value.
		 * @param  expires @type Date Cookie expiration date.
		 * @param  path @type String Cookie validity path.
		 * @param  domain @type String Cookie validity domain (part).
		 * @param  secure @type Boolean Is cookie valid only using https?.
		 */
		function _setCookie(name, value, expires, path, domain, secure) {
			var newCookie = name + '=' + escape(value) +
				(expires ? '; expires=' + expires.toGMTString() : '') +
				(path	 ? '; path='	+ path : '') +
				(domain	 ? '; domain='	+ domain : '') +
				(secure	 ? '; secure' : '');
			_log('Setting cookie: ' + newCookie);
			document.cookie = newCookie;
		}

		/**
		 * Logs a message.
		 *
		 * @param  message @type mixed Log message.
		 * @param  priority @type String Message priority (log, debug, info, warning, error).
		 */
		function _log(message, priority) {
			_logEnabled && console[priority || 'debug']('[ABTest] %s: %s',
				arguments.callee.caller.name || 'main', message);
		}

		/**
		 * Logs an error message.
		 *
		 * @param  message @type mixed Log message.
		 */
		function _error(message) {
			_log(message, 'error');
		}

		/**
		 * Tests is a function exists in current scope.
		 *
		 * @param  functionName @type String Funcion name.
		 */
		function _functionExists(functionName) {
			return typeof ABTest[functionName] == 'function';
		}

		/**
		 * String trimming function.
		 *
		 * @return @type string Trimmed string.
		 */
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		}
	}
}