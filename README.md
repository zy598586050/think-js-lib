<p align="center">
  <img width="300px" src="https://www.think-js.cn/icon.png">
</p>

<p align="center">
  <a href="http://www.think-js.cn">
    <img src="https://img.shields.io/badge/npm-v1.1.0-blue">
  </a>
  <a href="http://www.think-js.cn">
    <img src="https://img.shields.io/badge/downloads-110k/month-green">
  </a>
  <a href="http://www.think-js.cn">
    <img src="https://codecov.io/gh/element-plus/element-plus/branch/dev/graph/badge.svg?token=BKSBO2GLZI"/>
  </a>
  <br>
</p>

<p align="center">一个企业级的NodeJS应用框架</p>

- 💪 减少造轮子拿来即用
- 🔥 集成了众多常用SDK

## think-js-lib

[think-js-lib](https://www.npmjs.com/package/think-js-lib) 是 [ThinkJS框架](https://www.think-js.cn) 的核心依赖，两者互相依托不可分开。之所以将核心功能拆分成单独的依赖包，是为了避免核心包版本迭代过程中影响 ThinkJS框架层的业务逻辑。如果想使用 think-js-lib 升级后的新功能，只需要修改 ThinkJS框架中 ``package.json`` 里 ``think-js-lib`` 的版本，重新 ``install`` 即可。

## 目录结构

```
.
├── lib                          // 依赖目录
│   ├── config.js                // 全局配置文件
│   ├── controller.js            // 控制器
│   ├── elasticsearch.js         // ES封装
│   ├── error.js                 // 全局异常处理
│   ├── errorcode.js             // 状态码枚举
│   ├── exception.js             // 重写异常处理
│   ├── log4j.js                 // 日志输出
│   ├── model.js                 // 模型
│   ├── mongodb.js               // mongodb封装
│   ├── route.js                 // 路由实现
│   ├── start.js                 // 初始化文件
│   ├── thinkdb.js               // mysql封装
│   ├── thinkredis.js            // redis封装
│   ├── utils.js                 // 常用工具函数
│   └── validate.js              // 参数验证器
├── index.js                     // 入口文件
├── package.json                 // 配置文件
└── README.md                    // 项目介绍
```

## 更新

卸载旧版重新安装

```
pnpm uninstall think-js-lib

pnpm install think-js-lib@1.1.1
```

修改 package.json 里版本号安装

```
"think-js-lib": "1.1.1"

pnpm install

```

## 常用功能

* ``this.Utils`` &ensp; // 常用工具函数调用，注意这是一个属性
* ``this.getToken()`` &ensp; // 生成JWT TOKEN
* ``this.validateToken()`` &ensp; // 验证JWT TOKEN是否正确
* ``this.getParams()`` &ensp; // 获取GET POST传参，同时可校验参数
* ``this.showSuccess()`` &ensp; // 返回JSON格式数据
* ``this.ApiException()`` &ensp; // 返回一个异常
* ``this.Db()`` &ensp; // 使用MySql数据库
* ``this.RDb()`` &ensp; // 使用Redis
* ``this.EDb()`` &ensp; // 使用ElasticSearch
* ``this.MDb()`` &ensp; // 使用MongoDB
* ``this.M()`` &ensp; // 使用模型
* ``this.Log4j()`` &ensp; // 使用日志处理
* ``this.WxPay()`` &ensp; // 使用微信支付
* ``this.AliPay()`` &ensp; // 使用支付宝支付
* ``this.SMS()`` &ensp; // 使用阿里短信服务
* ``this.OSS()`` &ensp; // 使用阿里对象存储
* ``this.Fetch()`` &ensp; // 使用网络请求

## 执照

ThinkJS已申请软件著作，可在中国版权保护中心中查看
[CPCC](https://www.ccopyright.com.cn).