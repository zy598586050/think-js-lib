/*
 * @Author: zhangyu
 * @Date: 2021-04-17 18:38:00
 * @LastEditTime: 2021-08-17 20:47:28
 */

const HttpException = require('./exception.js')
const appConfig = require('./config.js')
const router = require('koa-router')
const Router = new router()
const fs = require('fs')
const jwt = require('jsonwebtoken')
const ErrorCode = require('./errorcode')
const Controller = require('./controller')

// 路由
const Route =  {
    // 动态执行控制器方法
    async load(str,ctx){
        let controller = null
        let arr = null
        try{
            arr = str.split('/')
            const before = arr.splice(0,arr.length-1).join('/')
            // ctx上挂载
            ctx.before = before
            // 控制器方法
            ctx.after = arr[arr.length-1]
            controller = new (require(`@/controller/${before}.js`))
        }catch(e){
            throw new HttpException({
                msg: `路由配置第二个参数有误[${str}]`,
                errorCode: ErrorCode.ERROR_ROUTE,
                statusCode: 500
            })
        }
        return this.getReturnObj(await controller[ctx.after](ctx))
    },
    // 获取返回对象
    getReturnObj(obj){
        if(obj instanceof Object){
            return {
                body: {
                    code: obj.code,
                    msg: obj.msg,
                    data: obj.data
                },
                status: obj.statusCode
            }
        }else{
            throw new HttpException({
                msg: '返回值不是一个对象类型',
                errorCode: ErrorCode.ERROR_CODE,
                statusCode: 500
            })
        }
    },
    // 判读路由是否重复
    isRepeat(url){
        if(Router.stack.some(v => v.path == url)){
            throw new HttpException({
                msg: `路由重复[${url}]`,
                errorCode: ErrorCode.ERROR_ROUTE,
                statusCode: 500
            })
        }
    },
    // 挂载方法到ctx
    mount(ctx){
        // 引入控制器
        const CT = new Controller()
        // 挂载Token校验方法
        ctx.validateToken = (token) => {
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
        // MYSQL数据库
        ctx.Db = (tableName,db = 'db') => CT.Db(tableName,db)
        // Redis库
        ctx.RDb = (db = 'db') => CT.RDb(db)
        // 挂载ElasticSearch
        ctx.EDb = (db = 'db') => CT.EDb(db)
        // 挂载MongoDB
        ctx.MDb = (tableName,db = 'db') => CT.MDb(tableName,db)
        // 挂载Log4j
        ctx.Log4j = (str,level = 'debug') => CT.Log4j(str,level)
    },
    // GET路由
    get(url,str,middleware = null){
        // 判读路由是否重复
        this.isRepeat(url)
        // 定义get请求
        Router.get(url,async (ctx) => {
            // 挂载
            this.mount(ctx)
            // 载入
            const result = await this.load(str,ctx)
            // 有中间件
            if(typeof middleware == 'function'){
                await middleware(ctx,() => {
                    ctx.body = result.body
                    ctx.status = result.status
                },(msg = '请求错误',errorCode = 30000,statusCode = 400) => {
                    throw new HttpException({
                        msg,
                        errorCode,
                        statusCode
                    })
                })
            }else{
                // 无中间件
                ctx.body = result.body
                ctx.status = result.status
            }
        })
    },
    // POST路由
    post(url,str,middleware = null){
        // 判读路由是否重复
        this.isRepeat(url)
        Router.post(url,async (ctx) => {
            // 挂载
            this.mount(ctx)
            // 载入
            const result = await this.load(str,ctx)
            if(typeof middleware == 'function'){
                await middleware(ctx,() => {
                    ctx.body = result.body
                    ctx.status = result.status
                },(msg = '请求错误',errorCode = 30000,statusCode = 400) => {
                    throw new HttpException({
                        msg,
                        errorCode,
                        statusCode
                    })
                })
            }else{
                // 无中间件
                ctx.body = result.body
                ctx.status = result.status
            }
        })
    },
    // 分组
    group(prefix,callback,middleware = null){
        callback({
            get: (url,str) => {
                this.get(`${prefix}${url}`,str,middleware)
            },
            post: (url,str)  => {
                this.post(`${prefix}${url}`,str,middleware)
            }
        })
    }
}

// 加载路由配置
fs.readdirSync('./route').forEach(file => {
    let fun = require(`@route/${file}`)
    fun(Route)
})

module.exports = Router