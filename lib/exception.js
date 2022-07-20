/*
 * @Author: zhangyu
 * @Date: 2021-04-18 14:01:39
 * @LastEditTime: 2021-04-18 14:05:23
 */

// 重写错误结构
class HttpException extends Error{
    constructor(obj){
        super()
        this.msg = obj.msg
        this.errorCode = obj.errorCode
        this.statusCode = obj.statusCode
    }
}

module.exports = HttpException