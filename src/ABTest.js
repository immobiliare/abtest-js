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
 * http://opensource.org/licenses/BSD-3-Clause
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to opensource@immobiliare.it so we can send you a copy immediately.
 *
 * @see https://github.com/immobiliare/abtest-js
 * @author (C) 2010 Immobiliare.it <opensource@immobiliare.it>
 */
if (typeof ABTest == 'undefined') {
	var ABTest = new function () {

		var COOKIE_PREFIX = 'ABTest_'; /**< @type String (constant) Cookie prefix. */

		var NOW = new Date().getTime(); /**< @type Number (constant) Current timestamp. */

		var TEST_SESSION = { hours: 48 }; /**< @type object (constant) Default test session duration. */
		var MAX_TEST_SESSION = { days: 7 }; /**< @type object (constant) Default maximum test session duration. */

		var _logEnabled = false; /**< @type Boolean True to enable the event log, false otherwise. */
		var _luckiness = false; /**< @type Boolean True if the user is lucky, false otherwise. */
		var _isUserPartecipating = false; /**< @type Boolean True if the user is partecipating, false otherwise. */

		var _running = false; /**< @type Boolean Test is running and cannot be re-executed. */
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
		 *		   @li @c audience percentage of targeted visitors partecipating to the test
		 *		   @li @c probability Luckyness probability		 
		 *		   @li @c reparticipateOnProbabilityChange redraw if probability is changed since drawed
		 *		   @li @c redrawOnProbabilityChange redraw if probability is changed since drawed
		 *		   @li @c path (optional, default /) Site path validity (cookie path)
		 *		   @li @c domain (optional, default empty) Site domain validity (cookie domain)
		 *		   @li @c secure (optional, default false) Use https protocol (cookie secure)
		 *		   @li @c test Specific test options (test must exists)
		 *		   @li @c force (optional, default empty) Parameter name to enable version forcing
		 *		          (-1 always unlucky, 0 no-force, 1 always lucky)
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
				_error("Test '" + options.test.name + "' did not load.");
				return;
			}

			options.session = options.session || TEST_SESSION;
			options.maxSession = options.maxSession || MAX_TEST_SESSION;

			options.probability = options.probability || 50;
			options.audience = options.audience || 100;
			options.path = options.path || '/';
			options.domain = options.domain || '';
			options.secure = options.secure || false;

			options.force = options.force || '';

			options.reparticipateOnProbabilityChange = options.reparticipateOnProbabilityChange || false;
			options.redrawOnProbabilityChange = options.redrawOnProbabilityChange || false;

			_testName = name;
			_testOptions = options;

			_log('Starting A/B test ' + name + '.');

			if (_userSession()) {
				_runTest();
			} else {
				_log('Cookies are not supported, skipping test...');
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
		 * User luckiness.
		 *
		 * @return @type Boolean True if the current user is lucky.
		 */
		this.isUserLucky = function () {
			return _luckiness == 1;
		}

		/**
		 * User Partecipating.
		 *
		 * @return @type Boolean True if the current user is partecipating.
		 */
		this.isUserPartecipating = function () {
			return _isUserPartecipating == 1;
		}

		/**
		 * Adds custom test.
		 *
		 * @param  testFunction @type Function Test function.
		 */
		this.addTest = function (testName, testFunction) {
			if (!testName) {
				_error('The test function must be named');
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
		 * @return @type Boolean True if the cookie exsists, false otherwise.
		 */
		this.cookieExists = function (name) {
			return typeof _getCookie(COOKIE_PREFIX + _testName + '_' + name) != 'undefined';
		}

		/**
		 * Get a cookie value by name.
		 *
		 * @param  name @type String Cookie name
		 * @return @type String The cookie value, or undefined if no cookie
		 *		   exists with that name.
		 */
		this.getCookie = function (name) {
			return _getCookie(COOKIE_PREFIX + _testName + '_' + name);
		}

		/**
		 * Setup a new session-only cookie or updates an existing cookie with the
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
		 * Delete a new session-only cookie.
		 *
		 * @param  name @type String Cookie name.
		 */
		this.deleteCookieSession = function (name) {
			_setCookie(COOKIE_PREFIX + _testName + '_' + name, '', new Date(),
				_testOptions.path, _testOptions.domain, _testOptions.secure);
		}


		/**
		 * Runs the current test.
		 */
		function _runTest() {
			_allTests[_testOptions.test.name](
				_testOptions.test, { log: _log, error: _error });
		}

		/**
		 * Manages test cookie creation and expiration and, if cookie does not
		 * exist, draws the user.
		 *
		 * @return @type Boolean True if cookies are supported, false otherwise.
		 */
		function _userSession() {

			var isPartecipating,
				isPartecipatingCookieValue,
				isPartecipatingCookieValues,
				cookieValue,
				cookieValues,
				force,
				drawTime,
				wasUserLucky,
				probability,
				audience;

			if ((force = _getForce()) != 0) {
				_log('Current user is ' + (force == -1 ? 'un' : '') + 'lucky (forced)');
				cookieValue = NOW + ';' + (force == -1 ? '0' : '1') + ';' + _testOptions.probability + ';' + _testOptions.audience;
				_log('Current user is partecipating (forced)');
				isPartecipatingCookieValue = NOW + ';' + '1' + ';' + _testOptions.probability + ';' + _testOptions.audience;
			} else {
				cookieValue = _getCookie(COOKIE_PREFIX + _testName);
				isPartecipatingCookieValue = _getCookie(COOKIE_PREFIX + _testName + '_isPartecipating');
			}

			if (cookieValue && !isPartecipatingCookieValue) {
				cookieValues = cookieValue.split(';');
				cookieValues[2] = cookieValues[2] != undefined ? cookieValues[2] : _testOptions.probability;
				cookieValues[3] = cookieValues[3] != undefined ? cookieValues[3] : _testOptions.audience;
				isPartecipatingCookieValue = cookieValues[0] + ';' + '1' + ';' + cookieValues[2] + ';' + cookieValues[3];
			}

			isPartecipatingCookieValues = isPartecipatingCookieValue ? isPartecipatingCookieValue.split(';') : null;
			isPartecipating = isPartecipatingCookieValues ? parseInt(isPartecipatingCookieValues[1]) : null;
			audience = isPartecipatingCookieValues ? parseInt(isPartecipatingCookieValues[3]) : null;
			probability = isPartecipatingCookieValues ? parseInt(isPartecipatingCookieValues[2]) : null;
			drawTime = isPartecipatingCookieValues ? parseInt(isPartecipatingCookieValues[0]) : null;

			if (
				(
					(_testOptions.reparticipateOnProbabilityChange && 
						probability !== null &&
						probability != _testOptions.probability
					) ||
					audience != _testOptions.audience
				) &&
				force == 0 &&
				isPartecipating !== null && !isPartecipating
			) {
				var logMessage = 'The user is ';
				logMessage += (!isPartecipating ? 'NOT ' : '');
				logMessage += 'partecipating since ' + new Date(drawTime);
				if (audience != _testOptions.audience) {
					logMessage += ' but by audience change from ';
					logMessage += audience;
					logMessage += ' to ';
					logMessage += _testOptions.audience;
				} else {
					logMessage += ' but by probability change from ';
					logMessage += probability;
					logMessage += ' to ';
					logMessage += _testOptions.probability;
					logMessage += ' it will be redrawned (reparticipateOnProbabilityChange = true)';
				}

				_log(logMessage)

				isPartecipatingCookieValues = null;
				cookieValues = null;
				_deleteCookie(COOKIE_PREFIX + _testName);
			}

			isPartecipating = _isUserPartecipating = isPartecipatingCookieValues ? parseInt(isPartecipatingCookieValues[1]) : _drawUserElegibility(_testOptions.audience);
			isPartecipatingCookieValues = isPartecipatingCookieValues ? isPartecipatingCookieValues :
				new Array(NOW, isPartecipating, _testOptions.probability, _testOptions.audience);
			isPartecipatingCookieValue = isPartecipatingCookieValues.join(';');

			drawTime = parseInt(isPartecipatingCookieValues[0]);
			isPartecipating = parseInt(isPartecipatingCookieValues[1]);
			probability = parseInt(isPartecipatingCookieValues[2]);
			audience = parseInt(isPartecipatingCookieValues[3]);

			var expirationDate = NOW - drawTime <= _getTime(_testOptions.maxSession) ?
				new Date(NOW + _getTime(_testOptions.session)) : null;

			_setCookie(COOKIE_PREFIX + _testName + '_isPartecipating', isPartecipatingCookieValue,
				expirationDate, _testOptions.path, _testOptions.domain, _testOptions.secure);

			if (!isPartecipating) {
				_deleteCookie(COOKIE_PREFIX + _testName);
			}

			_log('The user was drawned to be ' +
				(!isPartecipating ? 'NOT' : '') +
				' elegible on ' + new Date(drawTime) +
				(drawTime == NOW ? ' (just now!)' : ''));

			_log('The user has' + (expirationDate ? ' not' : '') +
				' reached maxSession. Cookie expires ' +
				(expirationDate ? 'on ' + expirationDate : 'at the end of the current session.'));


			if (isPartecipating) {
				cookieValues = cookieValue ? cookieValue.split(';') : null;
				cookieValues = cookieValues ? cookieValues : null;
				probability = cookieValues ? parseInt(cookieValues[2]) : null;
				wasUserLucky = cookieValues ? parseInt(cookieValues[1]) : null;
				drawTime = cookieValues ? parseInt(cookieValues[0]) : null;

				if (
					_testOptions.redrawOnProbabilityChange &&
					force == 0 &&
					probability !== null && probability != _testOptions.probability &&
					wasUserLucky !== null && !wasUserLucky
				) {
					var logMessage = 'The user has been previously drawn on ' + new Date(drawTime);
					logMessage += ' and was ';
					logMessage += (wasUserLucky ? '' : 'un') + 'lucky, ';
					logMessage += ' but by probabilty change from ';
					logMessage += probability;
					logMessage += ' to ';
					logMessage += _testOptions.probability;
					logMessage += ' it will be redrawned (redrawOnProbabilityChange = true)';

					_log(logMessage)
					cookieValues = null;
				}

				cookieValues = cookieValues ? cookieValues :
					new Array(NOW, _drawUser(_testOptions.probability), _testOptions.probability, _testOptions.audience);
				cookieValue = cookieValues.join(';');

				drawTime = parseInt(cookieValues[0]) || 0;
				wasUserLucky = _luckiness = parseInt(cookieValues[1]) > 0;
				probability = parseInt(cookieValues[2]) || null;

				_log('The user has been drawn on ' + new Date(drawTime) +
					(drawTime == NOW ? ' (just now!)' : '') + ' and was ' +
					(wasUserLucky ? '' : 'un') + 'lucky.');

				var expirationDate = NOW - drawTime <= _getTime(_testOptions.maxSession) ?
					new Date(NOW + _getTime(_testOptions.session)) : null;

				_log('The user has' + (expirationDate ? ' not' : '') +
					' reached maxSession. Cookie expires ' +
					(expirationDate ? 'on ' + expirationDate : 'at the end of the current session.'));

				_setCookie(COOKIE_PREFIX + _testName, cookieValue,
					expirationDate, _testOptions.path, _testOptions.domain, _testOptions.secure);
			}

			_getCookie(COOKIE_PREFIX + _testName);
			return _getCookie(COOKIE_PREFIX + _testName + '_isPartecipating') == isPartecipatingCookieValue;
		}

		/**
		 * Draws an user.
		 *
		 * @param  probability @type Number Probability percentage (range 0..100).
		 * @return @type Number In range 0..1 0 => User is unlucky, 1 => User is lucky.
		 */
		function _drawUser(probability) {
			var isUserLucky = ((Math.random() * 100 - probability) < 0);
			_log('Is current user lucky? Probability is ' + probability + '%... ' +
				(isUserLucky ? 'Yes!' : 'No!'));
			return new Number(isUserLucky);
		}

		/**
		 * Draws an user.
		 *
		 * @param  probability @type Number Probability percentage (range 0..100).
		 * @return @type Number In range 0..1 0 => User is unlucky, 1 => User is lucky.
		 */
		function _drawUserElegibility(audience) {
			var isUserElegible = ((Math.random() * 100 - audience) < 0);
			_log('Is current user elegible ? Audience is ' + audience + '%... ' +
				(isUserElegible ? 'Yes!' : 'No!'));
			return new Number(isUserElegible);
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
			var MIN = 60 * 1000;
			var HOUR = 60 * MIN;
			var DAY = 24 * HOUR;
			duration = duration || {};
			return (duration.days || 0) * DAY +
				(duration.day || 0) * DAY +
				(duration.hours || 0) * HOUR +
				(duration.hour || 0) * HOUR +
				(duration.minutes || 0) * MIN +
				(duration.minute || 0) * MIN;
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
				var cookieValue = currentCookie.length > 1 ? unescape(currentCookie[1].trim()) : '';
				_log('Cookie name: ' + name + ' - Cookie value: ' + cookieValue);
				return cookieValue;
			}
			_log('Cookie ' + name + ' does not exist.');
		}

		/**
		 * Delete a cookie.
		 *
		 * @param  name @type String Cookie name.
		 */
		_deleteCookie = function (name) {
			_setCookie(name, '', new Date(),
				_testOptions.path, _testOptions.domain, _testOptions.secure);
		}

		/**
		 * Get the force parameter value.
		 *
		 * @return @type Number The force parameter value.
		 */
		function _getForce() {
			if (_testOptions.force == '') {
				_log('Version forcing is disabled.');
				return 0;
			}
			var regExp = new RegExp('[?&]' + _testOptions.force + '=(-?1)(&|$)');
			var matches = regExp.exec(window.location.search);
			if (!matches) {
				_log('Version forcing is enabled with parameter ' + _testOptions.force +
					' but no valid force parameter was specified in the query string (' + window.location.search + ')');
				return 0;
			}
			var numRet = parseInt(matches[1]);
			_log('Version forcing is enabled with parameter ' + _testOptions.force + ' = ' + numRet);
			return numRet;
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
				(path ? '; path=' + path : '') +
				(domain ? '; domain=' + domain : '') +
				(secure ? '; secure' : '');
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
			_logEnabled && typeof console != 'undefined' &&
				console[priority || 'log']('[ABTest] %s: %s',
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
