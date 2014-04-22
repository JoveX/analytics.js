## MO日志规范

### 文档目的
用于制定MO站的所有日志统计请求规范，MO站内所有日志请求都会按此规范发送。日志记录了客户端用户的基本信息，以及操作信息。在不同模块下，用户的访问记录、操作行为将被记录并传输到服务器。

### 基础格式构成
[host]+[必选参数]+[自定义参数]

### 日志获取地址
[host]

### 必选参数描述
#### client_id
用于识别用户的唯一标识。  
生成规则：包含字母和数字的唯一32位字符串，不区分大小写。

#### session_id
生成规则：包含字母和数字的唯一32位字符串，不区分大小写，用户进入mo站即会生成。  
超时规则：若用户关闭了mo站，或一个小时内没有任何操作后过期。

#### log_id
每条日志的id。  
生成规则：包含字母和数字的唯一32位字符串，不区分大小写。

#### step_id
记录用户操作，从0开始，用户每次操作加1。

#### product
标识产品类别，固定为**mo**。

#### src
标识流量来源，如一搜等合作方。  
在同一个session周期，如果只有第一条日志带有src参数，则后续日志即使缺少此参数也默认为第一条日志的src值。  

#### version
程序当前版本号。

#### position
json对象，记录了用户当前位置等信息。

- adcode：用户所在城市
- mapcenter: 图面中心点经纬度
- userloc：用户当前所在位置，无法取到时默认值待定

### verify
安全校验机制与校验位运算公式。  
计算方法：将参数部分的字符串第10、20、30、40、50个字符分别进行charCode，将编码后的数字相加后变成十六进制。  
若后面的字符串长度不够，则将其忽略掉。  
如附录`日志URL示例与解释`，参数部分为：

    client_id=b4e99028-28ae-42b0-9131-51ca9e8aa4a2&session_id=050e5bae-f72a-4e7a-99f0-db5da66bd114&log_id=b927246d-f63a-4140-95a9-72475e267173&stepid=0&product=mo&src=sina&version=2.0.9&position={"adcode":"110000","mapcenter":{"lng":123.429096,"lat":41.796767},"userloc":{"lng":116.48194178938866,"lat":39.98985609894807}}&content={"oprCategory":"detail","oprCmd":"click","page":"detail/index","button":"call","data":{"poiid":"B000A8WBJ0","name":"火宴山"}}

计算方法如下：

    var search = 'client_id=b4e99028-28ae-42b0-9131-51ca9e8aa4a2&session_id=050e5bae-f72a-4e7a-99f0-db5da66bd114&log_id=b927246d-f63a-4140-95a9-72475e267173&stepid=0&product=mo&src=sina&version=2.0.9&position={"adcode":"110000","mapcenter":{"lng":123.429096,"lat":41.796767},"userloc":{"lng":116.48194178938866,"lat":39.98985609894807}}&content={"oprCategory":"detail","oprCmd":"click","page":"detail/index","button":"call","data":{"poiid":"B000A8WBJ0","name":"火宴山"}}';

    var verify,
        sum = 0;
    [10, 20, 30, 40, 50].forEach(function(index){
        if (!!search.charCodeAt(index)) {
            sum += search.charCodeAt(index);
        }
    });

    verify = sum.toString(16); // '176'

### content
json对象，自定义参数描述，记录用户操作信息。

- oprCategory：模块类别
- oprCmd：日志类别，如点击、css下载完成等事件
- page：用户所在页面url
- button：用户点击的按钮
- data：包括各方需求的定制数据，以及用户当前操作的其他数据信息。

### 其他服务端日志自动携带的参数
发送日志时服务器时间  
ua

### 日志切分策略
当日志总长度超过2000时，会将日志拆分为多条。  
可以按照如下字段将日志重新组合。

- total：日志一共拆分的条数
- page：表明当前日志为总日志的第几条

### 日志URL示例与解释
http://mo.amap.com/img/a.gif?client_id=b4e99028-28ae-42b0-9131-51ca9e8aa4a2&session_id=050e5bae-f72a-4e7a-99f0-db5da66bd114&log_id=b927246d-f63a-4140-95a9-72475e267173&stepid=0&product=mo&src=sina&version=2.0.9&position={"adcode":"110000","mapcenter":{"lng":123.429096,"lat":41.796767},"userloc":{"lng":116.48194178938866,"lat":39.98985609894807}}&content={"oprCategory":"detail","oprCmd":"click","page":"detail/index","button":"call","data":{"poiid":"B000A8WBJ0","name":"火宴山"}}


