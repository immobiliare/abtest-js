/**
 * @file
 * LoadCSS.js
 *
 * Simple A/B Test library custom test: Load custom CSS.
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
	 * Custom test: Load custom CSS.
	 * This test is useful to load an external CSS file if user is lucky.
	 *
	 * Mandatory options:
	 *   @li @c href The CSS file path.
	 *   @li @c media The CSS media type (default: screen).
	 */
	ABTest.addTest(function LoadCSS(options, logger) {
		if (!ABTest.isUserLucky()) {
			logger.log('Sorry, user is unlucky, no alternative CSS will be loaded.');
			return;
		}
		if (!options.href) {
			logger.error('Missing CSS href value.');
			return;
		}

		var linkElement = document.createElement('link');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('type', 'text/css');
		linkElement.setAttribute('media', options.media ? options.media : 'screen');
		linkElement.setAttribute('href', options.href);

		var headElement = document.getElementsByTagName('head');
		if (headElement && headElement[0]) {
			logger.log('Loading CSS from ' + options.href);
			headElement[0].appendChild(linkElement);
		} else {
			logger.error('Missing HEAD element.');
		}
	});
}