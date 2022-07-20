/*
 * @Author: zhangyu
 * @Date: 2021-04-25 20:46:37
 * @LastEditTime: 2021-04-25 20:49:25
 */

const fs = require('fs')
let appConfig = {}

// 加载配置文件
fs.readdirSync('./config').forEach(file => {
    let obj = require(`@config/${file}`)
    appConfig[file.replace('.js','')] = obj
})

module.exports = appConfig