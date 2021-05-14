# ABTestJS

ABTestJS is a A/B test javascript library that allows developers to easily compare two versions of the same deployed service, and identify the best solution. Easily extendable, it allows to perform A/B tests on a multitude of services by uploading an alternative CSS or provide different versions of the same page.

## SimpleRedirect
This test is useful to redirect a user between site versions, changing a specific part in the domain name. Examples:
 * www.example.com => beta.example.com
 * site.v1.example.com => site.v2.example.com

It stores the referer in a cookie, so that it can be retrieved after the redirect

When you make an ab/test you need that the same number of users will see the two variants (probability = 50), and maybe you dont'w want to test all of your users but just a subset, let's say the half of them (audience = 50)

Use the following snippets for configuring the A/B test
* Include the script
```html
<script type="text/javascript" charset="utf-8" src="src/ABTest.js"></script>
<script type="text/javascript" charset="utf-8" src="src/ABTest/SimpleRedirect.js"></script>
```

* Configure the A/B test
```javascript
    if (typeof ABTest == 'object') {
        ABTest.enableLog(true);
        ABTest.start('v5-beta', {
			audience: 50,
            probability: 50, domain: '.example.com',
            test: {
                name: 'SimpleRedirect',
                siteLucky: 'a.example.com', siteUnlucky: 'b.example.com'
            }
        });
    }
```
This script will create a `ABTest_v5-beta_SimpleRedirect` cookie. The cookie will contain the referer if the redirect did occur, or an empty value otherwise.

This script will create a `ABTest_v5-beta_isPartecipating` cookie that indicates if user was drawed to partecipate in the abtest, and the config parameters when drawed.

The cookie will contain three values separated by ";" in the form
```
timestamp;isPartecipating;probability;audience
```
Example
```
1621239169035%3B1%3B51%3B74 => 1621239169035;1;50;100
```

This script will create a `ABTest_v5-beta_isPartecipating` cookie that indicates if user was drawed to partecipate in the abtest, and the config parameters when drawed.

The cookie will contain three values separated by ";" in the form
```
timestamp;isPartecipating;probability;audience
```
Example
```
1621239169035%3B1%3B51%3B74 => 1621239169035;1;50;100
```


The following properties are available in the ABTest object:
* __\_referrer__: the site referrer if the redirect did occur, empty otherwise

The following methods are available in the ABTest object:
* __isUserLucky()__: evaluates to `false` if the redirect did occur, `true` otherwise
* __isUserPartecipating()__: evaluates to `false` if the user is not drawed to partecipate

Please refer to the inline documentation of `src/ABTest.js` and `src/ABTest/SimpleRedirect.js` for the complete list of options and methods

__Note__: if audience changes all 'excluded users' will be redrawned for partecipate to ab test

## Incremental Release

Following the previous paragraph everything is settled to conduct an ab test.
Once the test is finished we can conduct an incremental release using two additional parameters

* __redrawOnProbabilityChange__: the effect of this configurations is to redraw all users that were unlucky in the previous draw when the probability changes. If the user is excluded from test this change will have no effects.

and

* __reparticipateOnProbabilityChange__: the effect of this configurations is to redraw for partecipating all users that were excluded in the previous draw when the probability changes.

The next example, takes all users on the lucky version of the page/site

* Configure the full release
```javascript
    if (typeof ABTest == 'object') {
        ABTest.enableLog(true);
        ABTest.start('v5-beta', {
			audience: 100,
            probability: 100, domain: '.example.com',
			redrawOnProbabilytChange: true
			reparticipateOnProbabilityChange: true
            test: {
                name: 'SimpleRedirect',
                siteLucky: 'a.example.com', siteUnlucky: 'b.example.com'
            }
        });
    }
```

## LoadCSS
This test is useful to load an external CSS file for the _'lucky'_ A/B user
 
Use the following snippets for configuring the A/B test
* Include the script
```html
<script type="text/javascript" charset="utf-8" src="src/ABTest.js"></script>
<script type="text/javascript" charset="utf-8" src="src/ABTest/LoadCSS.js"></script>
```

* Configure the A/B test
```javascript
	if (typeof ABTest == 'object') {
		ABTest.enableLog(true);
		ABTest.start('v5-beta', {
			audience: 50,
			probability: 50, domain: '.example.com',
			test: {
				name: 'LoadCSS',
				href: 'sample-alternative.css'
			}
		});
	}

	function _trackClick() {
		if (typeof ABTest != 'object' || typeof pageTracker == 'undefined') {
			return;
		}
		alert('Hey, you are really ' + (ABTest.isUserLucky() ? '' : 'un') + 'lucky!');
		pageTracker._trackEvent('Test', 'click');
	}
```

Please refer to the inline documentation of `src/ABTest.js` and `src/ABTest/LoadCSS.js` for the complete list of options and methods

## Custom Tests
You can easily write your own test


* Implement the test
```javascript
    if (typeof ABTest == 'object') {
	    ABTest.addTest('MyCustomTest', function (options, logger) {
	        // ...
	    }
    }
```

* Include the script
```html
<script type="text/javascript" charset="utf-8" src="src/ABTest.js"></script>
<script type="text/javascript" charset="utf-8" src="src/ABTest/MyCustomTest.js"></script>
```

* Configure the test options and fire it
```javascript
	if (typeof ABTest == 'object') {
		ABTest.start('my-custom-test', {
			audience: 50,
			probability: 50, domain: '.example.com',
			test: {
				name: 'MyCustomTest',
				my-custom-option: '...'
			}
		});
	}
```

# License
Copyright (c) 2010, Immobiliare.it S.p.A.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.:
