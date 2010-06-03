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
	 * In the SimpleRedirect cookie it stores the referer, in this way it 
	 * can be retrieved after the redirect in the ABTest._referrer variable
	 *
	 * Options:
	 *   @li @c hostPart (optional) The part (starting from 0) to be changed.
	 *   @li @c siteLucky The domain lucky version (eg. beta or beta.example.com)
	 *   @li @c siteUnlucky The domain standard version (eg. www or www.example.com)
	 */
	ABTest.addTest('SimpleRedirect', function (options, logger) {
		if (!options.siteLucky || !options.siteUnlucky) {
			logger.error('Missing host part and/or site specs.');
			return;
		}

		if (ABTest.cookieExists('SimpleRedirect')) {
			if(ABTest.getCookie('SimpleRedirect') != 'NULL') {
				ABTest._referrer = ABTest.getCookie('SimpleRedirect');
			}
			else {
				ABTest._referrer = ''; //Force an empty referer
			}
			logger.log('Potential loop detected, exiting.');
			ABTest.deleteCookieSession('SimpleRedirect');
			return;
		}

		var site = ABTest.isUserLucky() ?
			options.siteLucky : options.siteUnlucky;

		var winLoc = window.location;
		if (typeof options.hostPart != 'undefined' && options.hostPart >= 0) {
			var hostParts = winLoc.hostname.split('.');
			hostParts[options.hostPart] = site;
			site = hostParts.join('.');
		}

		if (site == winLoc.hostname) {
			logger.log('No redirection needed.');
			return;
		}

		var url = winLoc.protocol + '//' + site +
			(winLoc.port ? ':' + winLoc.port : '') +
			winLoc.pathname + winLoc.search + winLoc.hash;

		ABTest.setCookieSession('SimpleRedirect', (typeof document.referrer != 'undefined') ? document.referrer : 'NULL');
		logger.log('Redirecting to ' + url);
		window.location.replace(url);
	});
}