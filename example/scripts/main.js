/**
 * requirejs调用示例
 * @authors 徐永全 (xuyq1112@gmail.com)
 * @date    2014-04-25 04:13:52
 * @version 0.1
 */

require.config({
    paths: {
        "logger": "http://127.0.0.1:3000/build/logger.min"
    }
});
require(["logger"], function(_amapaq) {
    _amapaq('action', 'send');
});