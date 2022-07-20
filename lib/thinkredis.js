/*
 * @Author: zhangyu
 * @Date: 2021-04-17 18:37:49
 * @LastEditTime: 2021-04-28 14:34:56
 */

const redis = require('redis')
const appConfig = require('./config.js')
const HttpException = require('./exception.js')
const ErrorCode = require('./errorcode')
const log4j = require('./log4j')

class Redis {

  // 重连
  init(db = 'db'){
    try{
      this.redisClient = redis.createClient(appConfig.redis[db].prot,appConfig.redis[db].host,appConfig.redis[db].db)
    }catch(error){
      log4j.error('redis错误',error.msg || error.message)
    }
    this.db = db
  }

  /**
   * 实例
   */
  RDb(db = 'db'){
    this.init(db)
    return this
  }

  /*
  * 获取存储在给定键中的值
  * key 键
  */
  get(key){
    return new Promise((resolve,reject) => {
      this.redisClient.get(key,(err,val) => {
        if(err){
          let obj = {
              msg: `[redis错误]: ${err}`,
              errorCode: ErrorCode.ERROR_REDIS,
              statusCode: 500
          }
          // 这里的异常抛出问题有待解决
          reject(obj)
          throw new HttpException(obj)
        }else{
          try{
            resolve(JSON.parse(val))
          }catch(e){
            resolve(val)
          }
        }
        this.redisClient.quit()
      })
    })
  }

  /*
  * 设置存储在给定键中的值
  * key 键
  * val 值
  * timeout 过期时间 默认不设置
  * callback 过期后执行的事件函数
  */
  set(key,val,timeout = '',callback){
    if(typeof callback == 'function'){
      this.redisClient.send_command('config',['set','notify-keyspace-events','Ex'],() => {
        let sub = redis.createClient(appConfig.redis[this.db].prot,appConfig.redis[this.db].host,appConfig.redis[this.db].db)
        sub.subscribe(`__keyevent@${appConfig.redis[this.db].db}__:expired`,() => {
          sub.on('message',(chan, msg) => {
            if(msg == key){
              callback()
            }
          })
          this.redisClient.set(key,val)
          if(timeout){
            this.redisClient.expire(key,timeout)
          }
          this.redisClient.quit()
        })
      })
    }else{
      if(typeof val == 'object'){
        val = JSON.stringify(val)
      }
      this.redisClient.set(key,val)
      if(timeout){
        this.redisClient.expire(key,timeout)
      }
      this.redisClient.quit()
    }
  }

  /*
  * 删除存储在给定键中的值
  * key 键
  */
  del(key){
    this.redisClient.del(key)
    this.redisClient.quit()
  }

  /*
  * 以哈希的方式存储
  * key 键
  * val 值 object类型
  * timeout 过期时间 默认不设置
  */
  hmset(key,val,timeout = ''){
    this.redisClient.hmset(key,val)
    if(timeout){
      this.redisClient.expire(key,timeout)
    }
    this.redisClient.quit()
  }

  /*
  * 读取哈希值
  * key 键
  * val 键
  */
  hget(key,val){
    return new Promise((resolve,reject) => {
      this.redisClient.hget(key,val,(err,value) => {
        if(err){
          let obj = {
              msg: `[redis错误]: ${err}`,
              errorCode: ErrorCode.ERROR_REDIS,
              statusCode: 500
          }
          // 这里的异常抛出问题有待解决
          reject(obj)
          throw new HttpException(obj)
        }else{
          resolve(value)
        }
      })
      this.redisClient.quit()
    })
  }

  /*
  * 从存储的哈希中删除指定的字段
  * name 名称
  * key 键
  */
  hdel(name,key){
    this.redisClient.hdel(name,key)
    this.redisClient.quit()
  }

  /*
  * 将存储的数字key递减
  * key 64位有符号整数
  * num 减量 默认为1
  */
  decrby(key,num = 1){
    this.redisClient.decrby(key,num)
    this.redisClient.quit()
  }

  /*
  * 将存储的数字key递增
  * key 64位有符号整数
  * num 增量 默认为1
  */
  incrby(key,num = 1){
    this.redisClient.incrby(key,num)
    this.redisClient.quit()
  }

  /*
  * 将给定值推入列表的右端
  * key 键
  * val 值
  */
  rpush(key,val){
    this.redisClient.rpush(key,val)
    this.redisClient.quit()
  }

  /*
  * 从列表右端弹出一个值
  * key 键
  */
  rpop(key){
    return new Promise((resolve,reject) => {
      this.redisClient.rpop(key,(err,val) => {
        if(err){
          let obj = {
              msg: `[redis错误]: ${err}`,
              errorCode: ErrorCode.ERROR_REDIS,
              statusCode: 500
          }
          // 这里的异常抛出问题有待解决
          reject(obj)
          throw new HttpException(obj)
        }else{
          resolve(val)
        }
      })
      this.redisClient.quit()
    })
  }
  
}

module.exports = Redis