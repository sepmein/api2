/**
 * Created by Spencer on 16/2/23.
 */
'use strict';
let router = require('koa-router')();
let matchCollectionFromDB = require('../middlewares/matchCollectionFromDB');
//login
function* getAuthCollectionFromDB(next) {
    this.collection = this.db.collection('user');
    yield next;
}
router.post('/auth', getAuthCollectionFromDB,
    function*(next) {
        const bcrypt = require('../lib/bcrypt'),
            jwt = require('jsonwebtoken'),
            secret = process.env.JWT_SECRET || require('../secret');

        let userName = this.request.body.userName,
            password = this.request.body.password;

        let result =
            yield this.collection.find({
                userName: userName
            }).toArray();
        let found = (result.length === 1);
        if (found) {
            let user = result[0];
            try {
                var same = yield bcrypt.compare(password, user.password);
                if (same) {
                    this.body = jwt.sign({
                        userName: userName,
                        _id: user._id
                    }, secret);
                } else {
                    this.status = 401;
                    this.body = {message: 'password not match'};
                }
            } catch (e) {
                console.log(e);
                console.log(e.stack);
                //this.throw(500, e);
                this.status = 500;
                this.body = {message: 'Server Error: bcrypt compare error'};
            }
        } else {
            this.status = 401;
            this.body = {message: 'User not exist'};
        }
    });
//register
router.put('/auth', getAuthCollectionFromDB, function*(next) {
    const bcrypt = require('../lib/bcrypt'),
        jwt = require('jsonwebtoken'),
        secret = process.env.JWT_SECRET || require('../secret');

    let userName = this.request.body.userName,
        password = this.request.body.password;

    let result = yield this.collection.find({userName: userName}).toArray();

    let existed = (result.length === 1);
    if (existed) {
        this.status = 403;
        this.body = {message: 'user already existed'};
        return;
    }
    let hash;
    try {
        hash = yield bcrypt.genHash(password);
    } catch (e) {
        this.throw(500, 'failed to register');
    }

    try {
        let user = yield this.collection.insertOne({
            userName: userName,
            password: hash
        });
        // use jwt to generate token
        let token = jwt.sign({
            userName: userName,
            _id: user._id
        }, secret);
        this.status = 201;
        this.body = {
            userName: userName,
            token: token
        };
    } catch (error) {
        this.status = 400;
        this.body = {message: error.message};
    }
});
//get user info
router.get('/user/:id', function *(next) {
});
//data api
//read batch
router.get('/app/:collection', matchCollectionFromDB, function *readBatch(next) {
    let limit = this.header.limit;
    let skip = this.header.skip;
    let options = {};
    if (limit) {
        options.limit = Number(limit);
    }
    if (skip) {
        options.skip = Number(skip);
    }
    let result;
    try {
        result = yield this.collection.find(this.request.body, options).toArray();
    } catch (e) {
        this.throw(500);
    }
    this.body = result;
});
//read single
router.get('/app/:collection/:id', matchCollectionFromDB, function *readSingle(next) {
    const is = require('is-js');
    const ObjectId = require('mongodb').ObjectID;
    let id = this.params.id;
    this.assert(ObjectId.isValid(id), 404);
    let result;
    try {
        result = yield this.collection.find({"_id": ObjectId(id)}).toArray();
    } catch (e) {
        this.throw(500);
    }
    if (is.empty(result)) {
        this.throw(404);
    }
    else {
        this.body = result[0];
    }
});

//create
router.post('/app/:collection', matchCollectionFromDB, function *create(next) {
    const is = require('is-js');
    let result;
    if (is.array(this.request.body)) {
        try {
            result = yield this.collection.insertMany(this.request.body);
        } catch (error) {
            this.throw(400, error);
        }
        this.body = result;
    } else if (is.object(this.request.body)) {
        try {
            result = yield this.collection.insertOne(this.request.body);
        } catch (error) {
            //TODO: 发生validation error时,找出错在哪里(比较错误的输入与validator),发送给客户端,mongo原生error提供信息过于简陋
            this.throw(400, error.stack);
        }
        this.body = result;
    }

});
//update
router.put('/app/:collection', matchCollectionFromDB);
//delete collection
router.del('/app/:collection', matchCollectionFromDB, function *deleteBatch() {
    let deleteOpResult;
    try {
        deleteOpResult = yield this.collection.deleteMany(this.request.body);
    } catch (e) {
        this.throw(500);
    }
    let result = deleteOpResult.result;
    if (result.ok) {
        this.body = deleteOpResult;
    } else {
        this.throw(400, 'delete failed');
    }
});
//delete single
router.del('/app/:collection/:id', matchCollectionFromDB, function *deleteSingle() {
    const ObjectId = require('mongodb').ObjectID;

    let id = this.params.id;
    this.assert(ObjectId.isValid(id), 404);
    let result;
    try {
        result = yield this.collection.deleteOne({"_id": ObjectId(id)});
    } catch (e) {
    }
    if (is.empty(result)) {
        this.throw(404);
    }
    else {
        this.body = result[0];
    }
});
module.exports = router;