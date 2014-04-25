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
        // 日志程序类型，比如MO固定传mo
        product: 'mo',
        // 日志发送的服务器地址
        trackerUrl: '//' + location.host + '/img/a.gif',
        // 程序当前版本号
        version: '2.1.0',
        // 使日志优先存入localStorage
        enableLocal: true,
        // localStorage可存放的最大数据容量
        // 当允许本地缓存时有效
        localSize: 100 * 1024,
        // 使用的cookie或localStorage缓存前缀
        cookieNamePrefix: '_webTeam_',
        // 优先读取配置的用户ID，若此值为空，则自动生一个uuid存入cookie
        clientId: 'client_0019241513534682987'
    });

- product：日志程序类型，比如MO固定传mo
- trackerUrl：日志发送的服务器地址
- version：程序当前版本号
- enableLocal：使日志优先存入localStorage
- localSize：localStorage可存放日志的最大数据容量
- cookieNamePrefix：使用的cookie或localStorage缓存前缀
- clientId：用户唯一标识。优先读取此配置的用户ID，若此值为空，则自动生一个uuid存入cookie

### 添加来源参数
用于标识当前流量来源  

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
