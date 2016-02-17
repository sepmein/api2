/**
 * Created by Spencer on 16/1/15.
 */
'use strict';
const Koa = require('koa');
const parse = require('co-body');

let matchCollectionFromDB = require('./middlewares/matchCollectionFromDB');
let allowMethod = require('./middlewares/allowMethod');
let parseBody = require('./middlewares/parseBody');

/* Create Koa Server */
let app = Koa();

app.use(function *setCrossOrigin(next) {
    console.log("\n-----------------------\n");
    this.set('Access-Control-Allow-Origin', '*');
    this.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
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

app.use(allowMethod(['GET', 'PUT', 'POST', 'DELETE']));

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
