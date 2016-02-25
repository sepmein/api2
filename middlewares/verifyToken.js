/**
 * Created by Spencer on 16/2/24.
 */
'use strict';
const jwt = require('jsonwebtoken');
const SECRET = require('../secret');
module.exports = function *(next) {
    console.log(this.header);
    if (this.header.authorization) {
        let authorization = this.header.authorization.split(' ');
        let bearer = authorization[0];
        let token = authorization[1];
        if (bearer !== 'Bearer') {
            this.throws(403, 'invalid token');
        } else {
            try {
                let decoded = jwt.verify(token, SECRET);
                this._id = decoded._id;
                yield next;
            } catch (e) {
                //有可能token过期,则应该更新token
                //有可能token无效
                //看看返回的error是什么,根据error的不同种类在决
                if (e.name === 'TokenExpiredError') {
                    this.throw(403, 'token expired');
                } else if (e.name === 'JsonWebTokenError') {
                    this.throw(403, 'token invalid');
                } else {
                    this.throw(500);
                }
            }
        }
    } else {
        this.throw(403, 'require login');
    }
};