/**
 * 日志
 * @authors 徐永全 (xuyq1112@gmail.com)
 * @date    2014-04-22 22:30:37
 * @version 0.1
 */

(function( window, factory ) {
    
    if (typeof window._amapaq !== 'function') {
        window._amapaq = function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            (window._amapaq.q = window._amapaq.q || []).push(args);
        };
        window._amapaq.q = [];
    }

    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory(window);
        });
    } else if (typeof(module) != 'undefined' && module.exports) {
        module.exports = factory(window);
    } else {
        window._amapaq = factory(window);
    }

}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

    if (typeof AMapLog !== 'object') {
        AMapLog = (function() {
            // 'use strict';

            /************************************************************
             * 私有变量
             ************************************************************/

            // Save bytes in the minified (but not gzipped) version:
            var ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype;

            // Create quick reference variables for speed access to core prototypes.
            var push = ArrayProto.push,
                slice = ArrayProto.slice,
                concat = ArrayProto.concat,
                toString = ObjProto.toString,
                hasOwnProperty = ObjProto.hasOwnProperty;

            // All **ECMAScript 5** native function implementations that we hope to use
            // are declared here.
            var nativeIsArray = Array.isArray,
                nativeKeys = Object.keys,
                nativeBind = FuncProto.bind;

            var
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

            /**
             * 提供localStorage的setItem\getItem\removeItem等方法
             */
            var toolLocalStorage = (function () {

                var localStorage = false,
                    // 当localStorage不可用时，将数据存入此对象中
                    toolLocalStorageData = {},
                    JSON = windowAlias.JSON;

                try {
                    // 在某些浏览器当cookies或localStorage被禁用时会抛出异常 (i.e. Chrome)
                    localStorage = windowAlias.localStorage;
                    localStorage.setItem('TEST', '1');
                    localStorage.removeItem('TEST');
                } catch (e) {
                    localStorage = false;
                }

                // MooTools Compatibility
                JSON.stringify = JSON.stringify || JSON.encode;
                JSON.parse = JSON.parse || JSON.decode;

                // 为Util提供一个localStorage的方法
                if (localStorage) {
                    return {
                        setItem: function(key, value) {
                            var str = JSON.stringify(value);
                            localStorage.setItem(key, str);
                        },
                        getItem: function(key) {
                            var value = localStorage.getItem(key);
                            // 当value里面有值再去用JSON.parse解析
                            // 否则在Android2.*上执行
                            // JSON.parse(null)或JSON.parse(undefined)
                            // 会抛出Illegal access错误
                            
                            // value没值，让function直接返回undefined
                            if (value) {
                                return JSON.parse(value);
                            }
                        },
                        removeItem: function(key) {
                            localStorage.removeItem(key);
                        }
                    };
                } else {
                    return {
                        setItem: function (key, value) {
                            if (value) {
                                toolLocalStorageData[key] = value;
                            }
                        },
                        getItem: function (key) {
                            return toolLocalStorageData[key];
                        },
                        removeItem: function (key) {
                            delete toolLocalStorageData[key];
                        }
                    };
                }
            }());


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


            /**
             * 判断是否为数组
             * es5有原生的判断方法
             */
            var isArray = nativeIsArray || function(obj) {
                    return toString.call(obj) == '[object Array]';
                };

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
             * 是否为空对象
             */
            function isEmptyObject(obj) {
                var name;
                for (name in obj) {
                    return false;
                }
                return true;
            }

            /**
             * 深度遍历对象，并将对象所有的叶子value进行uri编码
             */
            function deepEncodeObjValue(result, source) {
                for (var key in source) {
                    var copy = source[key];
                    // 如window.window === window，会陷入死循环，需要处理一下
                    if (source === copy) {
                        continue;
                    }
                    if (isObject(copy)) {
                        result[key] = arguments.callee(result[key] || {}, copy);
                    } else if (isArray(copy)) {
                        result[key] = arguments.callee(result[key] || [], copy);
                    } else {
                        result[key] = encodeURIComponent(copy);
                    }
                }
                return result;
            }

            /**
             * 根据白名单返回一个对象的副本
             * @param  {Object} obj      原始对象
             * @param  {Function} iterator 迭代器函数，用于过滤对象
             * @param  {Object} context  迭代器内部上线文
             * @return {Object}          过滤后的对象
             */
            function pick(obj, iterator, context) {
                var result = {};
                if (isFunction(iterator)) {
                    for (var key in obj) {
                        var value = obj[key];
                        if (iterator.call(context, value, key, obj)) result[key] = value;
                    }
                } else {
                    var keys = concat.apply([], slice.call(arguments, 1));
                    for (var i = 0, length = keys.length; i < length; i++) {
                        var key = keys[i];
                        if (key in obj) result[key] = obj[key];
                    }
                }
                return result;
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
             * javascript异步加载
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
             * 获取页面referrer
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
             * 从URL抓出协议
             */
            function getProtocolScheme(url) {
                var e = new RegExp('^([a-z]+):'),
                    matches = e.exec(url);

                return matches ? matches[1] : null;
            }

            /*
             * 从URL中抓出host
             */
            function getHostName(url) {
                // scheme : // [username [: password] @] hostame [: port] [/ [path] [? query] [# fragment]]
                var e = new RegExp('^(?:(?:https?|ftp):)/*(?:[^@]+@)?([^:/#]+)'),
                    matches = e.exec(url);

                return matches ? matches[1] : url;
            }

            /*
             * 从URL抓出参数
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
             * uuid
            ************************************************************/
            function uuid() {
                var _rnds = new Array(16);
                var _rng = function() {
                    for (var i = 0, r; i < 16; i++) {
                        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
                        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
                    }

                    return _rnds;
                };

                // Maps for number <-> hex string conversion
                var _byteToHex = [];
                for (var i = 0; i < 256; i++) {
                    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
                }

                // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
                function unparse(buf, offset) {
                    var i = offset || 0,
                        bth = _byteToHex;
                    return bth[buf[i++]] + bth[buf[i++]] +
                        bth[buf[i++]] + bth[buf[i++]] + '-' +
                        bth[buf[i++]] + bth[buf[i++]] + '-' +
                        bth[buf[i++]] + bth[buf[i++]] + '-' +
                        bth[buf[i++]] + bth[buf[i++]] + '-' +
                        bth[buf[i++]] + bth[buf[i++]] +
                        bth[buf[i++]] + bth[buf[i++]] +
                        bth[buf[i++]] + bth[buf[i++]];
                }

                var rnds = _rng();

                // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
                rnds[6] = (rnds[6] & 0x0f) | 0x40;
                rnds[8] = (rnds[8] & 0x3f) | 0x80;

                return unparse(rnds);
            }
            /************************************************************
             * uuid end
            ************************************************************/




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
             * 当页面来源是搜素引擎或翻译页面的话，对URL进行修正
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

            /**
             * 将单词首字母大写
             * @param  {String} word 首字母大写前的单词
             * @return {String}      首字母大写后的单词
             */
            function upperCaseFirstLetter (word) {
                return word.substr(0, 1).toUpperCase() + word.substr(1);
            }

            function Tracker (trackerUrl, siteId) {

                var
                    // 发送日志的路径
                    configTrackerUrl = '//' + location.host + '/img/a.gif',
                    configProduct,
                    configVersion,
                    configClientId,
                    // 是否启用localStorage存储离线日志
                    // true：启用离线日志
                    // false：不启用离线日志
                    // 默认：false
                    configEnableLocal = false,
                    // 如果将日志存入localStorage，限定可以存入localStorage的最大日志size总和
                    // 单位：byte
                    configLocalSize = 500 * 1024, // 500k
                    trackerData = [],
                    // First-party cookie name prefix
                    configCookieNamePrefix = '_amap_',
                    // Current URL and Referrer URL
                    locationArray = urlFixup(documentAlias.domain, windowAlias.location.href, getReferrer()),
                    domainAlias = domainFixup(locationArray[0]),
                    locationHrefAlias = locationArray[1],
                    configReferrerUrl = locationArray[2],
                    domainHash,
                    hash = sha1,
                    configCookieDomain,
                    configCookiePath,
                    configLogMaxLength = 2000,
                    // session超时时间，1小时
                    sessionTimeout = 3600000,
                    // 生成当前session的时间
                    sessionCreateTime,
                    // session id
                    sessionId,
                    // 来源站点标识
                    referrerFlag,
                    // 标识存储来源站点时的session ID
                    // 只在当前session周期生效
                    referrerSession,
                    // 步骤ID，每发一次日志，自增1
                    stepId = 0;



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
                 * 发送日志之前，拼装日志必要的参数
                 * 如：用户ID，session ID，log id等
                 * @return {[type]}             [description]
                 */
                function getNecessityParam () {
                    var paramArr = [
                        // 用户ID，读cookie
                        'client_id=' + getClientId(),
                        // session id
                        'session_id=' + getSessionId(),
                        // 从用户打开程序开始，每次发送日志自动增加1
                        'step_id=' + stepId++,
                        // 产品标识，MO为mo
                        'product=' + configProduct,
                    ];
                    // 来源
                    if (referrerFlag) {
                        paramArr.push('src=' + referrerFlag);
                    }
                    // 程序当前版本号
                    if (configVersion) {
                        paramArr.push('version=' + configVersion);
                    }

                    return paramArr;
                }

                /**
                 * 按照所给长度，截取字符串，并返回截取后的数组
                 * @param  {String} str 原始字符串
                 * @param  {Number} len 每段字符串的长度
                 * @return {Array}     截取后，以数组形式返回
                 */
                function spliceString (str, len) {
                    // 截取的数量
                    var num = str.length / len;
                    var result = [];
                    for (var i = 0; i < num; i++) {
                        result.push(str.substr(i * len, len));
                    }
                    return result;
                }

                /**
                 * 切割日志
                 * @param  {String} logId      当前日志ID
                 * @param  {String} contentStr 当前日志content部分字符串长度
                 * @return {Array}            切割后的字符串数组
                 */
                function spliceLog (logId, contentStr) {
                    // 已有的日志长度总和
                    var existLen = 0;
                    // 发送地址长度：'//mo.amap.com/img/a.gif'.length
                    existLen += configTrackerUrl.length;
                    // log_id=uuid长度：44
                    existLen += 44;
                    // 切割日志页码相关参数需要长度：20
                    existLen += 20;
                    // &content=这段也需要长度：10
                    existLen += 10;
                    // 协议，比如https:需要长度：6
                    existLen += 6;
                    // 校验位长度：30
                    existLen += 30;


                    // 剩余可用日志长度
                    var lastLen = configLogMaxLength - existLen;
                    // 切割日志页码相关参数需要长度：20
                    lastLen -= 20;
                    // &content=这段也需要长度：10
                    lastLen -= 10;
                    // 协议，比如https:需要长度：6
                    lastLen -= 6;
                    // 校验位长度：30
                    lastLen -= 30;


                    var result = [],
                        strList = spliceString(contentStr, lastLen);

                    for (var i = 0; i < strList.length; i++) {
                        result.push([
                            'log_id=' + logId,
                            'content=' + strList[i]
                        ].join('&'));
                    }

                    return result;
                }

                /**
                 * 根据字符串获取校验位
                 * @param  {String} str 原始字符串
                 * @return {String}     校验位
                 */
                function getVerify (str) {
                    var verify,
                        sum = 0;
                    var verifyIndexArr = [10, 20, 30, 40, 50];
                    for (var i = 0; i < verifyIndexArr.length; i++) {
                        if ( !! str.charCodeAt(verifyIndexArr[i])) {
                            sum += str.charCodeAt(verifyIndexArr[i]);
                        }
                    }
                    verify = sum.toString(16);
                    return verify;
                }

                /**
                 * 为请求的字符串添加校验位和分页
                 * @param {Array} requestList 请求链接的数组
                 */
                function addVerifyAndPage (requestList) {
                    if (requestList.length > 1) {
                        for (var i = 0; i < requestList.length; i++) {
                            requestList[i] += '&total=' + requestList.length;
                            requestList[i] += '&page=' + (i + 1);
                            requestList[i] += '&verify=' + getVerify(requestList[i]);
                        }
                    } else {
                        requestList[0] += '&verify=' + getVerify(requestList[0]);
                    }
                    return requestList;
                }

                /**
                 * 获取整个日志的search字符串，不截断日志
                 * @return {String} "a=1&b=2"
                 */
                function getRequest (logId, paramArr) {

                    var paramStr, requestList = [];
                    if (logId && paramArr) {
                    } else {
                        logId = uuid();
                        paramArr = getNecessityParam();
                        paramArr.push('log_id=' + logId);
                    }
                    paramStr = paramArr.join('&');

                    // 长度超出了日志的最大长度
                    if ((configTrackerUrl + paramStr).length + 30 > configLogMaxLength) {
                        paramArr.pop();
                        paramStr = paramArr.join('&');
                        var existLen = 0;
                        // 已有的日志长度总和
                        existLen += paramStr.length;
                        // 发送地址长度：'//mo.amap.com/img/a.gif'.length
                        existLen += configTrackerUrl.length;
                        // 切割日志页码相关参数需要长度：20
                        existLen += 20;
                        // &content=这段也需要长度：10
                        existLen += 10;
                        // 协议，比如https:需要长度：6
                        existLen += 6;
                        // 校验位长度：30
                        existLen += 30;

                        // 剩余可用日志长度
                        var lastLen = configLogMaxLength - existLen;
                        // 切割日志页码相关参数需要长度：20
                        lastLen -= 20;
                        // &content=这段也需要长度：10
                        lastLen -= 10;
                        // 协议，比如https:需要长度：6
                        lastLen -= 6;
                        // 校验位长度：30
                        lastLen -= 30;

                        paramStr += '&content=' + logContentStr.substr(0, lastLen);
                        // 第一条日志
                        requestList.push(paramStr);
                        requestList = requestList.concat(spliceLog(logId, logContentStr.substr(lastLen)));
                    } else {
                        requestList.push(paramStr);
                    }

                    requestList = addVerifyAndPage(requestList);

                    return requestList;
                }

                /**
                 * 拼装日志，并发送
                 */
                function logEcommerce () {
                    var client_id = getClientId(),
                        requestList = [];

                    // 存在localStorage中的key
                    var localStorageKey = configCookieNamePrefix + '.trackerData.' + domainHash;
                    // 若可以使用localStorage，则优先从localStorage中取出，和之前已有的数据数组合并
                    if (configEnableLocal) {
                        var tmpTrackerData = toolLocalStorage.getItem(localStorageKey) || [];
                        trackerData = trackerData.concat(tmpTrackerData);
                    }

                    if (trackerData.length > 0) {
                        for (var i = 0; i < trackerData.length; i++) {
                            requestList = requestList.concat(getRequest(trackerData[i].logId, trackerData[i].data));
                        }
                    } else {
                        requestList = requestList.concat(getRequest());
                    }

                    for (var j = requestList.length - 1; j >= 0; j--) {
                        // 发送请求
                        getImage(requestList[j]);
                    }

                    // 清空trackerData数组
                    trackerData.length = 0;
                    toolLocalStorage.removeItem(localStorageKey);
                }

                /**
                 * 获取用户id，单个用户的唯一标识
                 * @return {String} uuid
                 */
                function getClientId () {
                    var client_id = configClientId || getCookie(getCookieName('client_id'));
                    if (!client_id) {
                        client_id = uuid();
                        setCookie(getCookieName('client_id'), client_id);
                    }
                    return client_id;
                }

                /**
                 * 获取当前session id
                 * 用户没有任何操作一小时后过期
                 * @return {String} session id
                 */
                function getSessionId () {
                    var now = new Date().getTime();
                    // 没有session id，则创建一个
                    if (!sessionId) {
                        sessionId = uuid();
                    } else {
                        // 有session id，但过期了，再创建一个
                        if (now - sessionTimeout > sessionCreateTime) {
                            sessionId = uuid();
                        }
                    }
                    // 每次都更新一下session创建时间，当用户没有任何操作，一小时后过期
                    sessionCreateTime = now;
                    return sessionId;
                }

                /**
                 * 设置来源标识
                 * @param {String} src 
                 */
                function setReferrerFlag (src) {
                    referrerFlag = src;
                    referrerSession = getSessionId();
                }

                /**
                 * 获取来源标识
                 * @return {String} 来源标志
                 */
                function getReferrerFlag () {
                    if (referrerSession === getSessionId() && referrerFlag) {
                    } else {
                        referrerFlag = '';
                    }
                    return referrerFlag;
                }

                /**
                 * 获取拼接好 sessionID等字符串之后的对象
                 * @param  {String} trackerData 原始日志对象
                 * @return {Object}             组装好的日志对象
                 */
                function getFullLogObject (trackerData) {
                    
                    trackerData = trackerData || {};
                    var paramArr = getNecessityParam(trackerData),
                        logId = uuid(),
                        // 切割后的日志数组，会遍历此数组，逐个发送请求
                        requestList = [],
                        // 日志content部分的字符串
                        logContentStr = '';

                    paramArr.push('log_id=' + logId);

                    // 用户当前城市adcode、位置经纬度、图面中心点等信息
                    if (!!trackerData.position && !isEmptyObject(trackerData.position)) {
                        var position = pick(trackerData.position, 'adcode', 'mapcenter', 'userloc');
                        if (!isEmptyObject(position)) {
                            paramArr.push('position=' + JSON.stringify(trackerData.position));
                        }
                    }

                    // 用户自定义操作描述，记录用户操作等信息
                    if (!!trackerData.content && !isEmptyObject(trackerData.content)) {
                        // 过滤content中没有用的数据
                        var content = pick(trackerData.content, 'oprCategory', 'oprCmd', 'page', 'button', 'data');
                        // 深度遍历content，将其叶子value进行uri编码
                        content = deepEncodeObjValue({}, content);

                        if (!isEmptyObject(content)) {
                            logContentStr = JSON.stringify(content);
                            paramArr.push('content=' + logContentStr);
                        }
                    }

                    return {
                        logId: logId,
                        data: paramArr
                    };
                }

                updateDomainHash();

                // 日志系统参数配置
                var configMethod = {
                    // 设置发送日志的路径
                    setTrackerUrl: function (trackerUrl) {
                        configTrackerUrl = trackerUrl;
                    },
                    // 设置产品类型
                    setProduct: function (product) {
                        configProduct = product;
                    },
                    // 设置当前程序版本号
                    setVersion: function (version) {
                        configVersion = version;
                    },
                    // 设置来源标识
                    setReferrerFlag: setReferrerFlag,
                    // 设置是否启动离线日志
                    setEnableLocal: function (enabled) {
                        configEnableLocal = !!enabled;
                    },
                    setCookieNamePrefix: function (cookieNamePrefix) {
                        configCookieNamePrefix = cookieNamePrefix;
                    },
                    setClientId: function (client_id) {
                        configClientId = client_id;
                    },
                    setLocalSize: function (size) {
                        configLocalSize = size;
                    }
                };

                var actionMethod = {
                    // 发送日志
                    send: function () {
                        logEcommerce();
                    }
                };

                return {
                    // 统一的配置方法
                    config: function (option) {
                        var methodName = '';
                        for (var name in option) {
                            if (option.hasOwnProperty(name)) {
                                methodName = 'set' + upperCaseFirstLetter(name);
                                // 如果当前执行的set方法存在于configMethod中，则直接执行
                                if (isFunction(configMethod[methodName])) {
                                    configMethod[methodName](option[name]);
                                }
                            }
                        }
                    },
                    data: function (obj) {
                        obj = getFullLogObject(obj);
                        if (configEnableLocal) {
                            // 获取本地日志存储的key
                            var localStorageKey = configCookieNamePrefix + '.trackerData.' + domainHash;
                            // 获取本地已经存储的日志
                            var tmpTrackerData = toolLocalStorage.getItem(localStorageKey) || [];
                            // 将本次push的日志加入到日志队列
                            tmpTrackerData.push(obj);

                            // 如果本地日志超出最大存储值，则将最先push的日志删除
                            while (JSON.stringify(tmpTrackerData).length > configLocalSize) {
                                tmpTrackerData.shift();
                            }

                            toolLocalStorage.setItem(localStorageKey, tmpTrackerData);
                        } else {
                            trackerData.push(obj);
                        }
                    },
                    action: function (method) {
                        if (method && actionMethod[method]) {
                            actionMethod[method]();
                        }
                    }
                };
            }

            asyncTracker = new Tracker();

            // 先将_amapaq数组中的特定方法执行了，比如设置日志路径（setTrackerUrl）和设置产品类型（setProduct）等配置
            for (iterator = 0; iterator < _amapaq.q.length; iterator++) {
                if (_amapaq.q[iterator][0] === 'config') {
                    apply(_amapaq.q[iterator]);
                    delete _amapaq.q[iterator];
                }
            }

            // 执行_amapaq中其他的方法
            for (iterator = 0; iterator < _amapaq.q.length; iterator++) {
                if (_amapaq.q[iterator]) {
                    apply(_amapaq.q[iterator]);
                }
            }

            _amapaq.q.length = 0;
            delete _amapaq.q;

            // 直接执行_amapaq方法，判断需要进行的下一步操作
            _amapaq = function () {
                var args = [];
                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
                apply(args);
            };

            AMapLog = {};
            return AMapLog;
        }());
    }

    return _amapaq;
}));
