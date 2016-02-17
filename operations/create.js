"use strict";
let is = require('is-js');

function *create(next){
    /* check is json or array*/
    let result;

    if (is.array(this.request.body)) {
        try {
            result = yield this.collection.insertMany(this.request.body);
        } catch (error) {
            this.throw(400, error);
        }
        this.body = result;
    } else if (is.object(this.request.body)) {
        //console.log('a.1 is a string', is.string(this.request.body.a));
        try {
            result = yield this.collection.insertOne(this.request.body);
        } catch (error) {
            //TODO: 发生validation error时,找出错在哪里(比较错误的输入与validator),发送给客户端,mongo原生error提供信息过于简陋
            this.throw(400, error.stack);
        }
        //console.log('create result', result);
        this.body = result;
    }
}

module.exports = create;
