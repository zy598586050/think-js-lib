/*
 * @Author: zhangyu
 * @Date: 2021-04-25 20:21:15
 * @LastEditTime: 2021-08-05 09:38:29
 */

const mysql = require('mysql')
const appConfig = require('./config.js')
const HttpException = require('./exception.js')
const ErrorCode = require('./errorcode')
const moment = require('moment')

class ThinkDb {
    // 初始化
    init(db = 'db'){
        // 数据库实例名
        this.db = db
        // 表名
        this.tableName = ''
        // 表名重命名
        this.aliasStr = ''
        // 连表查询
        this.joinStr = ''
        // 查询的字段
        this.fieldStr = '*'
        // 条件
        this.whereStr = ''
        //查询的数量
        this.limitStr = ''
        // 更新或新增的键
        this.keyStr = ''
        // 更新或新增的值
        this.valueStr = ''
        // 更新组合。
        this.updateStr = ''
        // 排序
        this.orderStr = ''
        // 分组
        this.groupStr = ''
        // 是否去重
        this.isDistinct = ''
        // sql语句
        this.sql = ''
        this.isDeBug = false
    }

    /*
    * 实例
    * tableName为表名称
    * db为数据库实例名，默认是db
    */
    Db(tableName,db = 'db'){
        this.init(db)
        this.tableName = tableName
        return this
    }

    /*
    * beginTransaction()
    * 开启事务
    */
    beginTransaction(callback){
        console.log('开启事务')
        // 创建一个数据库连接
        this.connection = mysql.createConnection(appConfig.database['db'])
        // 连接数据库
        this.connection.connect()
        // sql语句存储
        this.sqlArray = []
        // 开启事务
        this.connection.beginTransaction(() => {
            for(let i = 0;i < this.sqlArray.length;i++){
                this.connection.query(this.sqlArray[i],(error,result) => {
                    if(error){
                        console.log('事务回滚')
                        this.connection.rollback()
                    }
                    if(this.sqlArray.length - 1 == i){
                        this.connection.end()
                    }
                })
            }
            console.log('提交事务')
            this.connection.commit()
        })
        callback()
    }

    /*
    * 事务专项insert
    * 新增一条数据
    * 传入一个对象
    */
    TInsert(obj){
        if(Object.keys(obj).length > 0){
            Object.keys(obj).forEach(v => {
                let K = ''
                this.keyStr += `,${v}`
                this.valueStr += `,'${obj[v] ? obj[v] : (obj[v] == 0 ? 0 : K)}'`
            })
            this.keyStr = `(${this.keyStr.substr(1)})`
            this.valueStr = `(${this.valueStr.substr(1)})`
            this.setInsertSql()
            this.sqlArray.push(this.sql)
        }
    }

    /*
    * 事务专项update
    * 更新一条数据
    * 传入一个对象
    */
    TUpdate(obj){
        if(Object.keys(obj).length > 0){
            Object.keys(obj).forEach(v => {
                this.updateStr += `,${v} = '${obj[v]}'`
            })
            this.updateStr = this.updateStr.substr(1)
            this.setUpdateSql()
            this.sqlArray.push(this.sql)
        }
    }

    /*
    * query()
    * query封装成promise
    */
    query(){
        // 创建一个数据库连接
        this.connection = mysql.createConnection(appConfig.database[this.db])
        // 连接数据库
        this.connection.connect()
        // 执行SQL语句
        return new Promise((resolve,reject) => {
            //this.connection.escape()
            if(this.isDeBug){
                console.log(this.sql)
            }
            this.connection.query(this.sql,(error,result) => {
                if(error){
                    let obj = {
                        msg: `[数据库错误]: ${this.sql}[${error}]`,
                        errorCode: ErrorCode.ERROR_MYSQL,
                        statusCode: 500
                    }
                    // 这里的异常抛出问题有待解决
                    reject(obj)
                    throw new HttpException(obj)
                }else{
                    resolve(result)
                }
            })
            // 断开连接
            this.connection.end()
        })
    }

    /*
    * setSql()
    * 组装查询的sql语句
    */
    setSql(){
        this.sql = `SELECT ${this.isDistinct} ${this.fieldStr} FROM ${this.tableName} ${this.aliasStr} ${this.joinStr} ${this.whereStr} ${this.orderStr} ${this.groupStr} ${this.limitStr}`
    }

    /*
    * setUpdateSql()
    * 组装更新的sql语句
    */
    setUpdateSql(){
        this.sql = `UPDATE ${this.tableName} SET ${this.updateStr} ${this.whereStr}`
    }

    /*
    * setInsertSql()
    * 组装新增的sql语句
    */
    setInsertSql(){
        this.sql = `INSERT INTO ${this.tableName} ${this.keyStr} VALUES ${this.valueStr}`
    }

    /*
    * setDeleteSql()
    * 组装删除的sql语句
    */
    setDeleteSql(){
        this.sql = `DELETE FROM ${this.tableName} ${this.whereStr}`
    }

    /*
    * setJoinSql()
    * 组装连表查询sql语句
    */
    setJoinSql(){
        this.sql = `SELECT ${this.fieldStr} FROM ${this.tableName} ${this.aliasStr} ${this.joinStr} ${this.whereStr} ${this.orderStr} ${this.limitStr}`
    }

    /*
    * 查询条件
    * param为查询的字段
    * condition为条件，= > < in like ,其中 = 可省略不写
    * value为查询的值
    */
    where(param,condition,value){
        if(arguments.length == 2){
            if(this.whereStr == ''){
                this.whereStr += `WHERE ${param} = '${condition}' `
            }else{
                this.whereStr += `AND ${param} = '${condition}'`
            }
        }else{
            if(condition == 'in'){
                let str = ''
                let arr = ''
                if(typeof value == 'object'){
                    arr = value
                }else{
                    arr = value.split(',')
                }
                Object.keys(arr).forEach(v => {
                    str += `,'${arr[v]}'`
                })
                str = str.substr(1)
                value = `(${str})`
            }else{
                value = `'${value}'`
            }
            if(this.whereStr == ''){
                this.whereStr += `WHERE ${param} ${condition} ${value} `
            }else{
                this.whereStr += `AND ${param} ${condition} ${value}`
            }
        }
        return this
    }

    /*
    * 查询条件
    * param为查询的字段
    * condition为条件，= > < in like ,其中 = 可省略不写
    * value为查询的值
    */
    whereOr(param,condition,value){
        if(arguments.length == 2){
            this.whereStr += `OR ${param} = '${condition}'`
        }else{
            if(condition == 'in'){
                let str = ''
                let arr = value.split(',')
                Object.keys(arr).forEach(v => {
                    str += `,'${arr[v]}'`
                })
                str = str.substr(1)
                value = `(${str})`
            }else{
                value = `'${value}'`
            }
            this.whereStr += `OR ${param} ${condition} ${value}`
        }
        return this
    }

    /*
    * 查询某个时间区间
    * time为时间字段
    * startTime开始时间
    * endTime结束时间
    */
    whereBetweenTime(time,startTime,endTime){
        // 判断前方是否已经使用了where
        if(this.whereStr.indexOf('where') > -1){
            this.whereStr += `${time} > '${startTime}' AND ${time} < '${endTime}'`
        }else{
            this.whereStr += `WHERE ${time} > '${startTime}' AND ${time} < '${endTime}'`
        }
        return this
    }

    /*
    * 排序条件
    * field代表根据哪个字段排序
    * sort代表排序规则，desc倒序，asc正序
    */
    order(field,sort = 'DESC'){
        this.orderStr = `ORDER BY ${field} ${sort}`
        return this
    }

    /*
    * 分页查询
    * current第几页
    * size每页显示多少条
    */
    page(current,size){
        this.limitStr = `LIMIT ${(current -1) * size},${size}`
        return this
    }

    /*
    * limit()
    * 指定要查询的条数
    */
    limit(number){
        this.limitStr = `LIMIT ${number}`
        return this
    }

    /*
    * 指定要显示的字段
    * 传入一个字符串 id,name,age
    */
    field(str){
        this.fieldStr = str
        return this
    }

    /*
    * group()
    * 分组查询
    */
    group(str){
        this.groupStr = `GROUP BY ${str}`
        return this
    }

    /*
    * distinct()
    * 是否去重
    */
    distinct(isDistinct = true){
        this.isDistinct = isDistinct ? 'distinct' : ''
        return this
    }

    /*
    * count()
    * 查询数量
    */
    async count(){
        this.fieldStr = 'count(*) as count'
        this.limitStr = ''
        this.setSql()
        let result = await this.query()
        let count = 0
        if(result.length > 0){
            count = result[0].count
        }
        return count
    }

    /*
    * 用于设置当前数据表的别名
    * 便于连表查询
    */
    alias(str){
        this.aliasStr = `AS ${str}`
        return this
    }

    /*
    * 关联查询
    * tableNameStr表名和别名 例: order B
    * whereStr关联条件 例: A.id = B.id
    * type关联类型,可以为inner,left,right,full,默认为left
    * inier: 如果表中有至少一个匹配，则返回行
    * left: 即使右表中没有匹配，也从左表返回所有的行
    * right: 即使左表中没有匹配，也从右表返回所有的行
    * full: 只要其中一个表中存在匹配，就返回行
    */
    join(tableNameStr,whereStr,type = 'left'){
        this.joinStr += `${type} JOIN ${tableNameStr} ON ${whereStr} `
        return this
    }

    /*
    * find()
    * 查询一条数据
    */
    async find(){
        this.limitStr = 'limit 1'
        this.setSql()
        let result = await this.query()
        return result.length > 0 ? result[0] : null
    }

    /*
    * select()
    * 查询多条数据
    */
    async select(){
        this.setSql()
        return await this.query()
    }
    
    /*
    * 更新一条数据
    * 传入一个对象
    * isAutoTime 是否开启自动时间戳，默认不开启
    */
    async update(obj,isAutoTime = false){
        if(Object.keys(obj).length > 0){
            Object.keys(obj).forEach(v => {
                this.updateStr += `,${v} = '${obj[v]}'`
            })
            if(isAutoTime){
                this.updateStr = this.updateStr.substr(1) + `,update_time = '${moment().format("YYYY-MM-DD HH:mm:ss")}'`
            }else{
                this.updateStr = this.updateStr.substr(1)
            }
            this.setUpdateSql()
            return await this.query()
        }
    }

    /*
    * 以某个字段递减
    * field 字段名
    * num 步减 默认步减为1
    */
    async decr(field,num = 1){
        this.limitStr = 'limit 1'
        this.setSql()
        let result = await this.query()
        try{
            this.updateStr = `${field} = ${result[0][field] - num}`
        }catch(error){
            let obj = {
                msg: `[数据库错误]: ${this.sql}[${error}]`,
                errorCode: ErrorCode.ERROR_MYSQL,
                statusCode: 500
            }
            throw new HttpException(obj)
        }
        this.setUpdateSql()
        return await this.query()
    }

    /*
    * 以某个字段递增
    * field 字段名
    * num 步长 默认步长为1
    */
    async incr(field,num = 1){
        this.limitStr = 'limit 1'
        this.setSql()
        let result = await this.query()
        try{
            this.updateStr = `${field} = ${result[0][field] + num}`
        }catch(error){
            let obj = {
                msg: `[数据库错误]: ${this.sql}[${error}]`,
                errorCode: ErrorCode.ERROR_MYSQL,
                statusCode: 500
            }
            throw new HttpException(obj)
        }
        this.setUpdateSql()
        return await this.query()
    }

    /*
    * 新增一条数据
    * 传入一个对象
    * isAutoTime 是否开启自动时间戳，默认不开启
    */
    async insert(obj,isAutoTime = false){
        if(Object.keys(obj).length > 0){
            Object.keys(obj).forEach(v => {
                let K = ''
                this.keyStr += `,${v}`
                this.valueStr += `,'${obj[v] ? obj[v] : (obj[v] == 0 ? 0 : K)}'`
            })
            if(isAutoTime){
                this.keyStr = `(${this.keyStr.substr(1)},create_time,update_time)`
                this.valueStr = `(${this.valueStr.substr(1)},'${moment().format("YYYY-MM-DD HH:mm:ss")}','${moment().format("YYYY-MM-DD HH:mm:ss")}')`
            }else{
                this.keyStr = `(${this.keyStr.substr(1)})`
                this.valueStr = `(${this.valueStr.substr(1)})`
            }
            this.setInsertSql()
            return await this.query()
        }
    }

    /*
    * 新增多条数据
    * 传入一个数组
    * 注意每个数组对象的结构需一致
    * isAutoTime 是否开启自动时间戳，默认不开启
    */
    async insertAll(array,isAutoTime = false){
        if(array.length > 0){
            for (let i = 0;i <= array.length-1; i++) {
                let keyStr = ''
                let valueStr = ''
                for(let o in array[i]){
                  let K = ''
                  keyStr += `,${o}`
                  valueStr += `,'${array[i][o] ? array[i][o] : (array[i][o] == 0 ? 0 : K)}'`
                }
                keyStr = keyStr.substr(1)
                valueStr = valueStr.substr(1)
                if(isAutoTime){
                    this.keyStr = `(${keyStr},create_time,update_time)`
                    this.valueStr += `,(${valueStr},'${moment().format("YYYY-MM-DD HH:mm:ss")}','${moment().format("YYYY-MM-DD HH:mm:ss")}')`
                }else{
                    this.keyStr = `(${keyStr})`
                    this.valueStr += `,(${valueStr})`
                }
            }
            this.valueStr = this.valueStr.substr(1)
            this.setInsertSql()
            return await this.query()
        }
    }

    /*
    * delete()
    * 删除一条数据
    */
    async delete(){
        this.setDeleteSql()
        return await this.query()
    }

    /*
    * SQL调试
    */
    debug(val = true){
        this.isDeBug = val
        return this
    }
}

module.exports = ThinkDb