/**
 * 日志
 * @authors 徐永全 (xuyq1112@gmail.com)
 * @date    2014-04-22 22:30:37
 * @version 0.1
 */

if (typeof _amapaq !== 'object') {
    _amapaq = [];
}

if (typeof AMapLog !== 'object') {
    AMapLog = (function() {
        'use strict';

        /************************************************************
         * 私有变量
         ************************************************************/

        var
        // expireDateTime,

        /* plugins */
        // plugins = {},

        /* alias frequently used globals for added minification */
            documentAlias = document,
            navigatorAlias = navigator,
            screenAlias = screen,
            windowAlias = window,

            /* encode */
            encodeWrapper = windowAlias.encodeURIComponent,

            /* decode */
            decodeWrapper = windowAlias.decodeURIComponent,

            /* urldecode */
            urldecode = unescape,

            /* asynchronous tracker */
            asyncTracker,

            /* iterator */
            iterator,

            /* local AMapLog */
            AMapLog;

        /************************************************************
         * 私有方法，工具类函数
         ************************************************************/

        /*
         * 是否定义
         */
        function isDefined(property) {
            var propertyType = typeof property;

            return propertyType !== 'undefined';
        }

        /*
         * 是否是function
         */
        function isFunction(property) {
            return typeof property === 'function';
        }

        /*
         * 是否是对象
         */
        function isObject(property) {
            return typeof property === 'object';
        }

        /*
         * 是否为字符串
         */
        function isString(property) {
            return typeof property === 'string' || property instanceof String;
        }

        /**
         * 模拟函数apply方法
         * @param  {String or Function} fun 执行的函数名或指针
         * @param  {Array} parameterArray 参数数组
         *
         * @example
         *      [ 'methodName', optional_parameters ]
         * or:
         *      [ functionObject, optional_parameters ]
         */
        function apply(arr, obj) {
            var i, f, parameterArray;

            for (i = 0; i < arguments.length; i += 1) {
                parameterArray = arguments[i];
                f = parameterArray.shift();

                if (isString(f)) {
                    asyncTracker[f].apply(asyncTracker, parameterArray);
                } else {
                    f.apply(asyncTracker, parameterArray);
                }
            }
        }

        /*
         * 跨浏览器的事件绑定
         */
        function addEventListener(element, eventType, eventHandler, useCapture) {
            if (element.addEventListener) {
                element.addEventListener(eventType, eventHandler, useCapture);

                return true;
            }

            if (element.attachEvent) {
                return element.attachEvent('on' + eventType, eventHandler);
            }

            element['on' + eventType] = eventHandler;
        }

        /*
         * Load JavaScript file (asynchronously)
         */
        function loadScript(src, onLoad) {
            var script = documentAlias.createElement('script');

            script.type = 'text/javascript';
            script.src = src;

            if (script.readyState) {
                script.onreadystatechange = function() {
                    var state = this.readyState;

                    if (state === 'loaded' || state === 'complete') {
                        script.onreadystatechange = null;
                        onLoad();
                    }
                };
            } else {
                script.onload = onLoad;
            }

            documentAlias.getElementsByTagName('head')[0].appendChild(script);
        }

        /*
         * Get page referrer
         */
        function getReferrer() {
            var referrer = '';

            try {
                referrer = windowAlias.top.document.referrer;
            } catch (e) {
                if (windowAlias.parent) {
                    try {
                        referrer = windowAlias.parent.document.referrer;
                    } catch (e2) {
                        referrer = '';
                    }
                }
            }

            if (referrer === '') {
                referrer = documentAlias.referrer;
            }

            return referrer;
        }

        /*
         * Extract scheme/protocol from URL
         */
        function getProtocolScheme(url) {
            var e = new RegExp('^([a-z]+):'),
                matches = e.exec(url);

            return matches ? matches[1] : null;
        }

        /*
         * Extract hostname from URL
         */
        function getHostName(url) {
            // scheme : // [username [: password] @] hostame [: port] [/ [path] [? query] [# fragment]]
            var e = new RegExp('^(?:(?:https?|ftp):)/*(?:[^@]+@)?([^:/#]+)'),
                matches = e.exec(url);

            return matches ? matches[1] : url;
        }

        /*
         * Extract parameter from URL
         */
        function getParameter(url, name) {
            var regexSearch = "[\\?&#]" + name + "=([^&#]*)";
            var regex = new RegExp(regexSearch);
            var results = regex.exec(url);
            return results ? decodeWrapper(results[1]) : '';
        }

        /*
         * UTF-8 encoding
         */
        function utf8_encode(argString) {
            return urldecode(encodeWrapper(argString));
        }



        /************************************************************
         * sha1
         * - based on sha1 from http://phpjs.org/functions/sha1:512 (MIT / GPL v2)
         ************************************************************/

        function sha1(str) {
            // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
            // + namespaced by: Michael White (http://getsprink.com)
            // +      input by: Brett Zamir (http://brett-zamir.me)
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +   jslinted by: Anthon Pang (http://piwik.org)

            var
                rotate_left = function (n, s) {
                    return (n << s) | (n >>> (32 - s));
                },

                cvt_hex = function (val) {
                    var strout = '',
                        i,
                        v;

                    for (i = 7; i >= 0; i--) {
                        v = (val >>> (i * 4)) & 0x0f;
                        strout += v.toString(16);
                    }

                    return strout;
                },

                blockstart,
                i,
                j,
                W = [],
                H0 = 0x67452301,
                H1 = 0xEFCDAB89,
                H2 = 0x98BADCFE,
                H3 = 0x10325476,
                H4 = 0xC3D2E1F0,
                A,
                B,
                C,
                D,
                E,
                temp,
                str_len,
                word_array = [];

            str = utf8_encode(str);
            str_len = str.length;

            for (i = 0; i < str_len - 3; i += 4) {
                j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 |
                    str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
                word_array.push(j);
            }

            switch (str_len & 3) {
            case 0:
                i = 0x080000000;
                break;
            case 1:
                i = str.charCodeAt(str_len - 1) << 24 | 0x0800000;
                break;
            case 2:
                i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000;
                break;
            case 3:
                i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) << 8 | 0x80;
                break;
            }

            word_array.push(i);

            while ((word_array.length & 15) !== 14) {
                word_array.push(0);
            }

            word_array.push(str_len >>> 29);
            word_array.push((str_len << 3) & 0x0ffffffff);

            for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
                for (i = 0; i < 16; i++) {
                    W[i] = word_array[blockstart + i];
                }

                for (i = 16; i <= 79; i++) {
                    W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
                }

                A = H0;
                B = H1;
                C = H2;
                D = H3;
                E = H4;

                for (i = 0; i <= 19; i++) {
                    temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }

                for (i = 20; i <= 39; i++) {
                    temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }

                for (i = 40; i <= 59; i++) {
                    temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }

                for (i = 60; i <= 79; i++) {
                    temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }

                H0 = (H0 + A) & 0x0ffffffff;
                H1 = (H1 + B) & 0x0ffffffff;
                H2 = (H2 + C) & 0x0ffffffff;
                H3 = (H3 + D) & 0x0ffffffff;
                H4 = (H4 + E) & 0x0ffffffff;
            }

            temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

            return temp.toLowerCase();
        }

        /************************************************************
         * end sha1
         ************************************************************/


        /*
         * Fix-up URL when page rendered from search engine cache or translated page
         */
        function urlFixup(hostName, href, referrer) {
            if (hostName === 'translate.googleusercontent.com') {       // Google
                if (referrer === '') {
                    referrer = href;
                }

                href = getParameter(href, 'u');
                hostName = getHostName(href);
            } else if (hostName === 'cc.bingj.com' ||                   // Bing
                    hostName === 'webcache.googleusercontent.com' ||    // Google
                    hostName.slice(0, 5) === '74.6.') {                 // Yahoo (via Inktomi 74.6.0.0/16)
                href = documentAlias.links[0].href;
                hostName = getHostName(href);
            }

            return [hostName, href, referrer];
        }

        /*
         * Fix-up domain
         */
        function domainFixup(domain) {
            var dl = domain.length;

            // remove trailing '.'
            if (domain.charAt(--dl) === '.') {
                domain = domain.slice(0, dl);
            }

            // remove leading '*'
            if (domain.slice(0, 2) === '*.') {
                domain = domain.slice(1);
            }

            return domain;
        }

        /*
         * Title fixup
         */
        function titleFixup(title) {
            title = title && title.text ? title.text : title;

            if (!isString(title)) {
                var tmp = documentAlias.getElementsByTagName('title');

                if (tmp && isDefined(tmp[0])) {
                    title = tmp[0].text;
                }
            }

            return title;
        }

        /************************************************************
         * Proxy object
         * - this allows the caller to continue push()'ing to _amapaq
         *   after the Tracker has been initialized and loaded
         ************************************************************/

        function TrackerProxy() {
            return {
                push: apply
            };
        }

        function Tracker (trackerUrl, siteId) {

            var
                // 发送日志的路径
                configTrackerUrl
                , configProduct
                , trackerData = []
                // First-party cookie name prefix
                , configCookieNamePrefix = '_amap_'
                // Current URL and Referrer URL
                , locationArray = urlFixup(documentAlias.domain, windowAlias.location.href, getReferrer())
                , domainAlias = domainFixup(locationArray[0])
                , locationHrefAlias = locationArray[1]
                , configReferrerUrl = locationArray[2]
                , domainHash
                , hash = sha1
                , configCookieDomain
                , configCookiePath
                ;



            /*
             * Set cookie value
             */
            function setCookie(cookieName, value, msToExpire, path, domain, secure) {
                var expiryDate;

                // relative time to expire in milliseconds
                if (msToExpire) {
                    expiryDate = new Date();
                    expiryDate.setTime(expiryDate.getTime() + msToExpire);
                }

                documentAlias.cookie = cookieName + '=' + encodeWrapper(value) +
                    (msToExpire ? ';expires=' + expiryDate.toGMTString() : '') +
                    ';path=' + (path || '/') +
                    (domain ? ';domain=' + domain : '') +
                    (secure ? ';secure' : '');
            }

            /*
             * Get cookie value
             */
            function getCookie(cookieName) {
                var cookiePattern = new RegExp('(^|;)[ ]*' + cookieName + '=([^;]*)'),
                    cookieMatch = cookiePattern.exec(documentAlias.cookie);

                return cookieMatch ? decodeWrapper(cookieMatch[2]) : 0;
            }

            /*
             * Get cookie name with prefix and domain hash
             */
            function getCookieName(baseName) {
                return configCookieNamePrefix + baseName + '.' + configProduct + '.' + domainHash;
            }

            /*
             * Update domain hash
             */
            function updateDomainHash() {
                domainHash = hash((configCookieDomain || domainAlias) + (configCookiePath || '/')).slice(0, 4); // 4 hexits = 16 bits
            }

            /*
             * 创建一个1x1的图片，向这个图片发送get请求
             */
            function getImage(request) {
                var image = new Image(1, 1);

                image.onload = function () {
                    iterator = 0; // To avoid JSLint warning of empty block
                };
                image.src = configTrackerUrl + (configTrackerUrl.indexOf('?') < 0 ? '?' : '&') + request;
            }

            /**
             * 获取整个日志的search字符串
             * @return {String} "a=1&b=2"
             */
            function getRequest () {
            }

            /**
             * 拼装日志，并发送
             */
            function logEcommerce () {
                var client_id = getClientId();
                for (var i = trackerData.length - 1; i >= 0; i--) {
                    console.log(trackerData[i]);
                }
                // console.log(client_id);
            }

            /**
             * 获取用户id，单个用户的唯一标识
             * @return {String} uuid
             */
            function getClientId () {
                var client_id = getCookie(getCookieName('client_id'));
                if (!client_id) {
                    client_id = uuid();
                    setCookie(getCookieName('client_id'), client_id);
                }
                return client_id;
            }

            updateDomainHash();

            return {
                setTrackerUrl: function (trackerUrl) {
                    configTrackerUrl = trackerUrl;
                },
                setProduct: function (product) {
                    configProduct = product;
                },
                setTrackerData: function (obj) {
                    console.log(obj);
                    trackerData.push(obj);
                },
                trackPageView: function () {
                    // getRequest();
                    logEcommerce();
                }
            };
        }

        asyncTracker = new Tracker();

        // 先将_amapaq数组中的特定方法执行了，比如设置日志路径（setTrackerUrl）和设置产品类型（setProduct）
        for (iterator = 0; iterator < _amapaq.length; iterator++) {
            if (_amapaq[iterator][0] === 'setTrackerUrl' || _amapaq[iterator][0] === 'setProduct') {
                apply(_amapaq[iterator]);
                delete _amapaq[iterator];
            }
        }

        // 执行_amapaq中其他的方法
        for (iterator = 0; iterator < _amapaq.length; iterator++) {
            if (_amapaq[iterator]) {
                apply(_amapaq[iterator]);
            }
        }

        // 将原来的数组替换为Tracker代理方法，每次执行push都直接执行对应的方法
        _amapaq = new TrackerProxy();

        AMapLog = {};
        return AMapLog;
    }());
}