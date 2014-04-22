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
                configTrackerUrl,
                configProduct
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
             * 创建一个1x1的图片，向这个图片发送get请求
             */
            function getImage(request) {
                var image = new Image(1, 1);

                image.onload = function () {
                    iterator = 0; // To avoid JSLint warning of empty block
                };
                image.src = configTrackerUrl + (configTrackerUrl.indexOf('?') < 0 ? '?' : '&') + request;
            }


            return {
                setTrackerUrl: function (trackerUrl) {
                    configTrackerUrl = trackerUrl;
                },
                setProduct: function (product) {
                    configProduct = product;
                },
                trackPageView: function () {
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