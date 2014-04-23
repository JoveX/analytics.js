前端日志 logger
=========


### 加载日志程序
    (function(f,g,c,a,d,h,e){f[d]=f[d]||function(){var j=[];for(var k=0;k<arguments.length;k++){j.push(arguments[k])}(f[d].q=f[d].q||[]).push(j)};var i=g,h=i.createElement(c),b=i.getElementsByTagName(c)[0];h.type="text/javascript";h.defer=true;h.async=true;h.src=a;b.parentNode.insertBefore(h,b)})(window,document,"script","//"+location.host+"/src/logger.js","_amapaq");

### 执行日志相关配置
    _amapaq('config', {
        product: 'mo',
        trackerUrl: '//' + location.host + '/img/a.gif',
        version: '2.1.0'
    });
- product：日志程序类型，比如MO固定传mo
- trackerUrl：日志发送的服务器地址
- version：当前版本号

### 添加来源参数
    _amapaq('config', {
        referrerFlag: 'sina'
    });

### 添加日志数据
    _amapaq('data', {
        position: {
            "adcode": "110000",
            "mapcenter": {
                "lng": 123.429096,
                "lat": 41.796767
            },
            "userloc": {
                "lng": 116.48194178938866,
                "lat": 39.98985609894807
            }
        },
        content: {
            "oprCategory": "detail",
            "oprCmd": "click",
            "page": "detail/index",
            "button": "call",
            "data": {
                "poiid": "B000A8WBJ0",
                "name": "⽕火宴⼭山"
            }
        }
    });

### 向服务器发送日志
    _amapaq('action', 'send');
