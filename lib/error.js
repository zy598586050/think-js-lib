/*
 * @Author: zhangyu
 * @Date: 2021-04-18 11:38:08
 * @LastEditTime: 2021-04-22 00:00:57
 */

const ErrorCode = require('./errorcode')
const log4j = require('./log4j')

// 异常处理
const errorHandler = async (ctx,next) => {
    try{
        await next()
        if(!ctx.body){
            log4j.info(`路由不存在【${ctx.path}】`)
            ctx.body = {
                msg: '路由不存在',
                errorCode: ErrorCode.ERROR_ROUTE
            }
        }
    }catch(error){
        log4j.error(error.msg || error.message)
        ctx.body = {
            msg: error.msg || error.message,
            errorCode: error.errorCode
        }
        ctx.status = error.statusCode || 500
    }
}

module.exports = errorHandler