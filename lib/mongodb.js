/*
 * @Author: zhangyu
 * @Date: 2021-04-17 18:37:49
 * @LastEditTime: 2021-09-10 20:16:06
 */

const appConfig = require('./config.js')
const HttpException = require('./exception.js')
const mongoose = require('mongoose')
const ErrorCode = require('./errorcode')
const Utils = require('./utils')

class MongDB {
  // 初始化
  init(db = 'db'){
    // 连接
    mongoose.connect(`mongodb://${appConfig.mongodb[db].user}:${appConfig.mongodb[db].password}@${appConfig.mongodb[db].host}:${appConfig.mongodb[db].port}/${appConfig.mongodb[db].database}`,{
        useNewUrlParser: true
    },(error) => {
        if(error){
            throw new HttpException({
                msg: `[MongoDB错误]: ${error}`,
                errorCode: ErrorCode.ERROR_MONGODB,
                statusCode: 500
            })
        }else{
            console.log('MongoDB连接成功')
        }
    })
  }

  /**
   * 创建模型
   * obj 定义模型
   * 是否开启自动时间戳
   */
  M(obj,isAutoTime = false){
      if(isAutoTime){
          obj = {
              ...obj,
              createTime: {
                  type: Date,
                  default: new Date()
              },
              updateTime: {
                  type: Date,
                  default: new Date()
              }
          }
      }
      const schema = mongoose.Schema(obj)
      try{
        this.model = mongoose.model(Utils.firstToUpper(this.modelName),schema,this.modelName)
      }catch(e){
        this.model = mongoose.model(Utils.firstToUpper(this.modelName))
      }
      return this
  }

  /**
   * 实例
   * modelName 模型名称
   * db 数据源
   */
  MDb(modelName,db = 'db'){
      // 模型名称
      this.modelName = modelName
      // 连接并创建模型
      this.init(db)
      return this
  }

  /**
   * 新增数据
   * objValue 新增的实际值
   * isAutoTime 是否开启自动时间戳
   */
  insert(objValue){
    return new Promise((resolve,reject) => {
        const insertObj = new this.model(objValue)
        insertObj.save().then(result => {
            resolve(result)
        }).catch(error => {
            let obj = {
                msg: `[ES错误]: ${error}`,
                errorCode: ErrorCode.ERROR_MONGODB,
                statusCode: 500
            }
            reject(obj)
            throw new HttpException(obj)
        })
    })
  }

  /**
   * 查询数据
   * objValue 查询条件
   * current 第几页
   * size 每页多少条
   */
  select(objValue,current,size){
      return new Promise((resolve,reject) => {
        let find = this.model.find(objValue)
        if(current && size){
            find = this.model.find(objValue).skip((current - 1) * size).limit(size)
        }
        find.then(result => {
            resolve(result)
        }).catch(error => {
            let obj = {
                msg: `[ES错误]: ${error}`,
                errorCode: ErrorCode.ERROR_MONGODB,
                statusCode: 500
            }
            reject(obj)
            throw new HttpException(obj)
        })
      })
  }

  /**
   * 更新数据
   * whereObj 条件限定
   * updateObj 更新表达式
   */
  update(whereObj,updateObj){
      return new Promise((resolve,reject) => {
          this.model.update(whereObj,updateObj).then(result => {
            resolve(result)
          }).catch(error => {
            let obj = {
                msg: `[ES错误]: ${error}`,
                errorCode: ErrorCode.ERROR_MONGODB,
                statusCode: 500
            }
            reject(obj)
            throw new HttpException(obj)
          })
      })
  }

  /**
   * 删除数据
   * whereObj 条件限定
   */
  delete(whereObj){
    return new Promise((resolve,reject) => {
        this.model.remove(whereObj).then(result => {
          resolve(result)
        }).catch(error => {
          let obj = {
              msg: `[ES错误]: ${error}`,
              errorCode: ErrorCode.ERROR_MONGODB,
              statusCode: 500
          }
          reject(obj)
          throw new HttpException(obj)
        })
    })
  }
}

module.exports = MongDB