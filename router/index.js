/**
 * Created by Spencer on 16/2/23.
 */
'use strict';
let router = require('koa-router')();
let matchCollectionFromDB = require('../middlewares/matchCollectionFromDB');
let verifyToken = require('../middlewares/verifyToken');
// login

/**
 * set collection name to auth collection
 * bind the collection name to *next*
 * @param {any} next koa next
 */
function * getAuthCollectionFromDB(next) {
  this.collection = this.db.collection('user');
  yield next;
}
router.use('/login', getAuthCollectionFromDB);
router.use('/register', getAuthCollectionFromDB);
router.use('/apps', getAuthCollectionFromDB, verifyToken);

router.post('/login', function * (next) {
  const bcrypt = require('bcrypt-promise');
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || require('../secret');

  let userName = this.request.body.userName;
  let password = this.request.body.password;

  // console.log(userName, password);

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
        this.body = {
          token: jwt.sign({
            userName: userName,
            _id: user._id
          }, secret)
        };
      } else {
        this.status = 401;
        this.body = {message: 'password not match'};
      }
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      // this.throw(500, e);
      this.status = 500;
      this.body = {message: 'Server Error: bcrypt compare error'};
    }
  } else {
    this.status = 401;
    this.body = {message: 'User not exist'};
  }
});

// update apps
router.put('/apps');
// delete apps
router.del('/apps');

router.use('/app/:collection', verifyToken, matchCollectionFromDB);
// read batch
router.get('/app/:collection', function * readBatch(next) {
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
// read single
router.get('/app/:collection/:id', function * readSingle(next) {
  const is = require('is-js');
  const ObjectId = require('mongodb').ObjectID;
  let id = this.params.id;
  this.assert(ObjectId.isValid(id), 404);
  let result;
  try {
    result = yield this.collection.find({_id: ObjectId(id)}).toArray();
  } catch (e) {
    this.throw(500);
  }
  if (is.empty(result)) {
    this.throw(404);
  } else {
    this.body = result[0];
  }
});

// create
router.post('/app/:collection', function * create(next) {
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
      // TODO: 发生validation error时,找出错在哪里(比较错误的输入与validator),发送给客户端,mongo原生error提供信息过于简陋
      this.throw(400, error.stack);
    }
    this.body = result;
  }
});
// update
router.put('/app/:collection');
// delete collection
router.del('/app/:collection', function * deleteBatch() {
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
// delete single
router.del('/app/:collection/:id', function * deleteSingle() {
  const ObjectId = require('mongodb').ObjectID;
  const is = require('is-js');

  let id = this.params.id;
  this.assert(ObjectId.isValid(id), 404);
  let result;
  try {
    result = yield this.collection.deleteOne({_id: ObjectId(id)});
  } catch (e) {
    this.throw(503);
  }
  if (is.empty(result)) {
    this.throw(404);
  } else {
    this.body = result[0];
  }
});
module.exports = router;
