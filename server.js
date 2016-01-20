/**
 * Created by Spencer on 16/1/15.
 */
'use strict';
const Koa = require('koa');
const parse = require('co-body');

let matchCollectionFromDB = require('./matchCollectionFromDB');

/* Create Koa Server */
let app = Koa();

app.use(function *(next) {
    console.log("\n-----------------------\n");
    yield next;
});

app.use(function *getCollectionNameFromUrl(next) {
    let paths = this.path.split('/');
    this.assert(paths[1], 404, 'Please Provide Collection Name');
    //this.assert(paths.length <= 2, 404, 'Not Found');
    this.collectionName = paths[1];
    yield next;
});

app.use(matchCollectionFromDB);

function allowMethod(methods) {
    return function * (next) {
        let thisMethod = this.method;
        let match = methods.some((method) => {
            console.log(this);
            return thisMethod === method;
        });
        if (match) {
            yield next;
        } else {
            this.throw(405);
        }
    }
}

app.use(allowMethod(['GET', 'PUT', 'POST', 'DELETE']));

let is = require('is-js');

function parseBody() {
    return function *(next) {
        //console.log('header', this.header);
        try {
            this.request.body = yield parse.json(this);
        } catch (e) {
            this.throw(400, e);
        }
        if (!is.empty(this.request.body)) {
            this.assert(this.is('application/json'), 400, 'Only Accepts JSON');
        }
        yield next;
    }
}

app.use(parseBody());

app.use(function *operationRouter(next) {
    console.log('method', this.method);
    switch (this.method) {
        case 'GET':
        {
            yield require('./operations/read').call(this, next);
            break;
        }
        case 'POST':
        {
            yield require('./operations/create').call(this, next);
            break;
        }
        case 'PUT':
        {
            yield require('./operations/update').call(this, next);
            break;
        }
        case 'DELETE':
        {
            yield require('./operations/del').call(this, next);
            break;
        }
    }
});

/* Connect to MongoDb and listen */

const Mongo = require('mongodb');

Mongo.connect('mongodb://localhost:27017/test', (err, db)=> {
    if (err) {
        app.throw(500);
    }
    app.context.db = db;
    app.listen(3000);
});
