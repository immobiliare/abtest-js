/**
 * @file
 * SimpleRedirect.js
 *
 * Simple A/B Test library custom test: Simple Redirect.
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
if (typeof ABTest == 'object') {
	/**
	 * Custom test: Simple Redirect.
	 * This test is useful to redirect from un site version to another site
	 * version changing a specific part in a domain name. Examples:
	 * www.example.com => beta.example.com
	 * site.v1.example.com => site.v2.example.com
	 *
	 * Mandatory options:
	 *   @li @c hostPart The part (starting from 0) to be changed.
	 *   @li @c siteLucky The domain lucky version (eg. beta)
	 *   @li @c siteUnlucky The domain standard version (eg. www)
	 */
	ABTest.addTest(function SimpleRedirect(options, logger) {
		if (typeof options.hostPart == 'undefined' ||
			!options.siteLucky || !options.siteUnlucky) {
			logger.error('Missing host part and/or site specs.');
			return;
		}

		if (ABTest.cookieExists('SimpleRedirect')) {
			logger.log('Potential loop detected, exiting.');
			ABTest.deleteCookieSession('SimpleRedirect');
			return;
		}

		var winLoc = window.location;
		var hostParts = winLoc.hostname.split('.');
		var siteType = ABTest.isUserLucky() ?
			options.siteLucky : options.siteUnlucky;

		if (siteType == hostParts[options.hostPart]) {
			logger.log('No redirection needed.');
			return;
		}

		hostParts[options.hostPart] = siteType;
		var url = winLoc.protocol + '//' + hostParts.join('.') +
			(winLoc.port ? ':' + winLoc.port : '') +
			winLoc.pathname + winLoc.search + winLoc.hash;

		ABTest.setCookieSession('SimpleRedirect', 'noLoop');
		logger.log('Redirecting to ' + url);
		window.location.replace(url);
	});
}