/**
 * Created by Spencer on 16/1/15.
 */
'use strict';
//middlewares
let allowMethod = require('./middlewares/allowMethod');
let parseBody = require('./middlewares/parseBody');
let cors = require('koa-cors');
//router
let router = require('./router');
/* Create Koa Server */
let app = require('koa')();
app.use(cors());
app.use(function *getCollectionNameFromUrl(next) {
    let paths = this.path.split('/');
    this.assert(paths[1], 404, 'Please Provide Collection Name');
    //this.assert(paths.length <= 2, 404, 'Not Found');
    this.collectionName = paths[1];
    yield next;
});
app.use(allowMethod(['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS']));
app.use(parseBody);
app.use(router.routes());

module.exports = app;