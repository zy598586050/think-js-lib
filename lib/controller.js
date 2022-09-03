/*
 * @Author: zhangyu
 * @Date: 2021-04-17 18:37:49
 * @LastEditTime: 2021-08-17 21:43:08
 */

const HttpException = require('./exception.js')
const goCheck = require('./validate.js')
const ThinkDb = require('./thinkdb.js')
const ThinkRedis = require('./thinkredis.js')
const ThinkES = require('./elasticsearch.js')
const fetch = require('node-fetch')
const ErrorCode = require('./errorcode')
const jwt = require('jsonwebtoken')
const appConfig = require('./config.js')
const utils = require('./utils')
const MongoDB = require('./mongodb')
const log4j = require('./log4j')
const wxpay = require('wxpay-v3')
const alipay = require('alipay-sdk').default
const sms = require('@alicloud/sms-sdk')
const oss = require('ali-oss')

class Controller{

    constructor(){
        // 挂载utils
        this.Utils = utils
    }

    /**
     * 生成JWT TOKEN
     * 第一个参数需要传入一个对象
     */
    getToken(obj,jwt_key = appConfig.app.jwt_key,expiresIn = appConfig.app.expiresIn){
        const token = jwt.sign(obj,jwt_key,{expiresIn})
        return token
    }

    /**
     * 通过TOKEN解析登录信息
     */
    validateToken = (token) => {
        let obj = null
        if(!token){
            throw new HttpException({
                msg: '非法请求,或Token过期',
                errorCode: ErrorCode.ERROR_TOKEN,
                statusCode: 400
            })
        }
        try{
            obj = jwt.verify(token,appConfig.app.jwt_key)
        }catch(e){
            throw new HttpException({
                msg: '非法请求,或Token过期',
                errorCode: ErrorCode.ERROR_TOKEN,
                statusCode: 400
            })
        }
        return obj
    }

    /*
    * 参数获取器
    * ctx 传入一个ctx
    * validate 控制是否开启对该控制器方法的参数校验 默认不开启
    */
    getParams(ctx,validate = false){
        let obj = {}
        if(ctx.request.method == 'GET'){
            obj = ctx.request.query
        }else if(ctx.request.method == 'POST'){
            obj = ctx.request.body
        }
        if(validate){
            try{
                let valObj = require(`@/validate/${ctx.before}.js`)
                Object.keys(valObj.rule).forEach(key => {
                    // 只验证有验证规则的参数
                    // 1. key 要验证的键
                    // 2. obj[key] 要验证的值
                    // 3. valObj.rule[key] 验证规则
                    // 4. 自定义验证提示
                    // 5. 分组验证
                    let message = '' 
                    if(Object.keys(valObj.message).filter(v => v == key).length > 0){
                        message = valObj.message[key]
                    }else{
                        message = {}
                        Object.keys(valObj.message).forEach(v => {
                            if(v.indexOf(`${key}.`) > -1){
                                message[v] = valObj.message[v]
                            }
                        })
                    }
                    goCheck(key,obj[key],valObj.rule[key],message,valObj.scene[ctx.after])
                })
            }catch(err){
                if(err.msg){
                    throw new HttpException(err)
                }else{
                    throw new HttpException({
                        msg: '验证器可能书写有误',
                        errorCode: ErrorCode.ERROR_VALIDATE,
                        statusCode: 500
                    })
                }
            }
        }
        return obj
    }

    /*
    * 返回成功的Json数据
    * data 实际数据
    * msg 状态消息
    * statusCode 状态码
    */
    showSuccess(data = [],msg = 'ok',code = 200,statusCode = 200){
        return {
            code,
            msg,
            data,
            statusCode
        }
    }

    /*
    * 异常或错误返回的Json数据
    * msg 状态消息
    * errorCode 错误码
    * statusCode 状态码
    */
    ApiException(msg = '请求错误',errorCode = 30000,statusCode = 400){
        throw new HttpException({
            msg,
            errorCode,
            statusCode
        })
    }

    /**
     * MYSQL数据库方法
     * Db()
     */
    Db(tableName,db = 'db'){
        const TDB = new ThinkDb()
        return TDB.Db(tableName,db = 'db')
    }

    /*
    * 挂载ThinkRedis
    * RDb()
    */
    RDb(db = 'db'){
        const TRDB = new ThinkRedis()
        return TRDB.RDb(db = 'db')
    }

    /**
     * 挂载elasticsearch
     * EDb()
     */
    EDb(db = 'db'){
        const TEDB = new ThinkES()
        return TEDB.EDb(db = 'db')
    }

    /**
     * 挂载MongoDB
     * MDb()
     */
    MDb(tableName,db = 'db'){
        const TMDB = new MongoDB()
        return TMDB.MDb(tableName,db = 'db')
    }

    /**
     * 挂载日志打印
     * str 日志内容
     * level 级别
     */
    Log4j(str,level = 'debug'){
        log4j[level](str)
    }

    /**
     * 挂载微信支付业务
     */
    WxPay({appid,mchid,private_key,serial_no,apiv3_private_key,notify_url} = {}){
        return new wxpay({
            appid: appid ?? appConfig.wx.wechat.appid,
            mchid: mchid ?? appConfig.wx.wxpay.mchid,
            private_key: private_key ?? appConfig.wx.wxpay.private_key,
            serial_no: serial_no ?? appConfig.wx.wxpay.serial_no,
            apiv3_private_key: apiv3_private_key ?? appConfig.wx.wxpay.key,
            notify_url: notify_url ?? appConfig.wx.wxpay.notify_url
        })
    }

    /**
     * 挂载支付宝支付业务
     */
    AliPay({appId,privateKey,encryptKey,alipayRootCertPath,alipayPublicCertPath,appCertPath} = {}){
        return new alipay({
            appId: appId ?? appConfig.alicloud.alipay.appId,
            privateKey: privateKey ?? appConfig.alicloud.alipay.privateKey,
            encryptKey: encryptKey ?? appConfig.alicloud.alipay.encryptKey,
            alipayRootCertPath: alipayRootCertPath ?? appConfig.alicloud.alipay.alipayRootCertPath,
            alipayPublicCertPath: alipayPublicCertPath ?? appConfig.alicloud.alipay.alipayPublicCertPath,
            appCertPath: appCertPath ?? appConfig.alicloud.alipay.appCertPath
        })
    }

    /**
     * 挂载短信验证码下发业务
     */
    SMS({accessKeyId,secretAccessKey} = {}){
        return new sms({
            accessKeyId: accessKeyId ?? appConfig.alicloud.accessKeyId,
            secretAccessKey: secretAccessKey ?? appConfig.alicloud.secretAccessKey
        })
    }

    /**
     * 挂载阿里OSS
     */
    OSS({accessKeyId,accessKeySecret,region,bucket} = {}){
        return new oss({
            accessKeyId: accessKeyId ?? appConfig.alicloud.accessKeyId,
            accessKeySecret: accessKeySecret ?? appConfig.alicloud.secretAccessKey,
            region: region ?? appConfig.alicloud.region,
            bucket: bucket ?? appConfig.alicloud.bucket
        })
    }

    /*
    * 网络请求
    * get 请求
    * post 请求
    */
    async Fetch({url,data,headers,method = 'GET'}){
        if(method == 'GET'){
            let res = await fetch(url)
            let result = await res.json()
            return result
        }else{
            if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                let newData = ''
                Object.keys(data).forEach(v => {
                    newData += `&${v}=${data[v]}`
                })
                data = newData.substr(1)
            } else {
                data = JSON.stringify(data)
            }
            let res = await fetch(url,{
                method: 'POST',
                body: data,
                headers
            })
            let result = await res.json()
            return result
        }
    }

    /*
    * 使用模型
    * 传入模型的文件名
    */
    M(fileName){
        return new (require(`@/model/${fileName}.js`))
    }
}

module.exports = Controller