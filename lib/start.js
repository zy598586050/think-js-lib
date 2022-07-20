/*
 * @Author: zhangyu
 * @Date: 2021-04-20 23:24:58
 * @LastEditTime: 2021-08-06 10:18:55
 */
require('module-alias/register')
const Koa = require('koa2')
const koaBody = require('koa-body')
const app = new Koa()
const Router = require('./route.js')
const errorHandler = require('./error.js')
const appConfig = require('./config.js')
const figlet = require('figlet')

module.exports = () => {
    app
    .use(errorHandler)
    .use(koaBody({
        multipart: true // 支持multipart-formdate表单，可用于文件上传
    }))
    .use(Router.routes(),Router.allowedMethods)
    .listen(appConfig.app.port)
    // 打印ThinkJS
    figlet('ThinkJS',(err,data) => {
        console.log(data)
    })
}