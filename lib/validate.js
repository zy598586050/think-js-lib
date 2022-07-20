/*
 * @Author: zhangyu
 * @Date: 2021-04-21 23:15:42
 * @LastEditTime: 2021-04-28 23:22:31
 */

const HttpException = require('./exception.js')
const ErrorCode = require('./errorcode')

const check = {
    // 必填校验
    require: (key,value,message) => {
        if(!value){
            throw new HttpException({
                msg: message ? message : `${key}不能为空`,
                errorCode: ErrorCode.ERROR_VALIDATE,
                statusCode: 400
            })
        }
    },
    // 手机号
    phone: (key,value,message) => {
        if(!/^[1][3,4,5,7,8][0-9]{9}$/.test(value)){
            throw new HttpException({
                msg: message ? message : `${key}格式不正确`,
                errorCode: ErrorCode.ERROR_VALIDATE,
                statusCode: 400
            })
        }
    }
}

const validate = (key,value,rule,message,scene) => {
    if(scene && scene.length > 0 && scene.indexOf(key) == -1) return
    // 判断是否是一个自定义验证规则
    if(typeof rule == 'function'){
        rule(value,(msg = '校验失败',errorCode = 30000,statusCode = 400) => {
            throw new HttpException({
                msg,
                errorCode,
                statusCode
            })
        })
    }else{
        if(typeof rule == 'string'){
            let rules = rule.split('|')
            rules.forEach(v => {
                if(check.hasOwnProperty(v)){
                    let msg = message
                    if(typeof message == 'object'){
                        let K = Object.keys(message).filter(val => val.indexOf(`.${v}`) > -1)
                        msg = message[K]
                    }
                    check[v](key,value,msg)
                }
            })
        }
    }
}

module.exports = validate