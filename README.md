前端日志 logger
=========


### 加载日志程序

#### 浏览器加载

    !function(a,b,c,d,e,f){a[e]=a[e]||function(){var c,b=[];for(c=0;c<arguments.length;c++)b.push(arguments[c]);(a[e].q=a[e].q||[]).push(b)},a[e].q=a[e].q||[];var h=b,f=h.createElement(c),i=h.getElementsByTagName(c)[0];f.type="text/javascript",f.defer=!0,f.async=!0,f.src=d,i.parentNode.insertBefore(f,i)}(window,document,"script","//"+location.host+"/build/logger.min.js","_amapaq");


#### amd等工具加载
需要在页面底部自行定义_amapaq的function，如下

    !function(a,b){a[b]=a[b]||function(){var d,c=[];for(d=0;d<arguments.length;d++)c.push(arguments[d]);(a[b].q=a[b].q||[]).push(c)},a[b].q=a[b].q||[]}(window,"_amapaq");

直接在requirejs中自行引用logger对应路径即可使用。


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
