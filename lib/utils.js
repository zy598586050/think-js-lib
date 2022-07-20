/*
 * @Author: zhangyu
 * @Date: 2021-04-25 20:46:37
 * @LastEditTime: 2021-04-25 20:49:25
 */
const alipayFormData = require('alipay-sdk/lib/form').default
const {KJUR, hextob64} = require('jsrsasign')
const crypto = require('crypto')
const md5 = require('md5-node')
const moment = require('moment')
moment.locale('zh-cn')
const fs = require('fs')

let Utils = {
    // 日期处理
    moment,
    // 首字母大写
    firstToUpper(str){
        return str.toLowerCase().replace(/( |^)[a-z]/g,(L)=>L.toUpperCase())
    },
    // 生成订单号
    orderCode(){
        let orderCode = ''
        for(let i = 0;i < 6;i++){
            orderCode += Math.floor(Math.random() * 10)
        }
        orderCode = new Date().getTime() + orderCode
        return orderCode
    },
    // 生成指定长度的随机数
    getNonceStr(len){
        let str = ''
        while(str.length < len){
            str +=  Math.random().toString(36).slice(2)
        }
        return str.slice(-len)
    },
    // sha1加密
    sha1(str){
        let shasum = crypto.createHash('sha1')
        shasum.update(str)
        str = shasum.digest('hex')
        return str
    },
    // RSA加密
    rsaSign(content, privateKey, hash='SHA256withRSA'){
        // 创建 Signature 对象
        const signature = new KJUR.crypto.Signature({
            alg: hash,//!这里指定 私钥 pem!
            prvkeypem: privateKey
        })
        signature.updateString(content)
        const signData = signature.sign()
        // 将内容转成base64
        return hextob64(signData)
    },
    // 对参数对象进行字典排序
    raw(args){
        let keys = Object.keys(args)
        keys = keys.sort()
        let newArgs = {}
        keys.forEach(function (key) {
            newArgs[key.toLowerCase()] = args[key]
        })
        let str = ''
        for (let k in newArgs) {
            str += '&' + k + '=' + newArgs[k]
        }
        str = str.substr(1)
        return str
    },
    // 获取真实IP
    getIP(ctx){
        let ip = ctx.req.headers['x-forwarded-for']
        || ctx.req.headers['x-real-ip']
        || ctx.req.ip
        || ctx.req.connection.remoteAddress
        || ctx.req.socket.remoteAddress
        || ctx.req.connection.socket.remoteAddress
        if(ip){
            ip = ip.replace('::ffff:', '')
            if(ip.indexOf(', ') > -1){
                ip = ip.split(', ')[1]
            }
        }
        return ip
    },
    // 生成手机验证码
    getValidateCode(len = 6){
        let number = ''
        for(let i = 0;i<len;i++){
            number += Math.floor(Math.random() * 10)
        }
        return number
    },
    // 阿里支付Form表单
    AlipayFormData(){
        return new alipayFormData()
    },
    // MD5加密
    MD5(text){
        return md5(text)
    },
    // 菜单变树结构
    arrayToTree(array,id = 'id',pid = 'pid'){
        return array.filter(father => {
            // 返回每一项的子项
            const children = array.filter(child => father[id] == child[pid])
            children.length > 0 ? father['children'] = children : father['children'] = []
            return father[pid] == 0 // 返回第一层
        })
    }
}

// 加载自定义工具函数
fs.readdirSync('./utils').forEach(file => {
    const obj = require(`@utils/${file}`)
    // 合并自定义扩展
    Object.assign(Utils, obj)
})

module.exports = Utils