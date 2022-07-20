/*
 * @Author: zhangyu
 * @Date: 2021-04-17 18:37:49
 * @LastEditTime: 2021-09-10 20:16:06
 */

const appConfig = require('./config.js')
const HttpException = require('./exception.js')
const elasticsearch = require('elasticsearch')
const ErrorCode = require('./errorcode')

class ElasticSearch {
  // 初始化
  init(db = 'db'){
    this.client = new elasticsearch.Client({
      host: appConfig.elastcsearch[db].host + ':' + appConfig.elastcsearch[db].port
    })
  }

  /**
   * 实例
   */
  EDb(db = 'db'){
    this.init(db = 'db')
    return this
  }

  /*
  * 查询
  * index 索引
  * body 查询结构
  */
  search(index,body){
    return new Promise((resolve,reject) => {
      this.client.search({index,body}).then(result => {
        resolve(result)
      }).catch(error => {
        let obj = {
            msg: `[ES错误]: ${error}`,
            errorCode: ErrorCode.ERROR_ES,
            statusCode: 500
        }
        reject(obj)
        throw new HttpException(obj)
      })
    })
  }
}

module.exports = ElasticSearch