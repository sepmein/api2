/**
 * Created by Spencer on 16/2/23.
 */
'use strict';
const Mongo = require('mongodb');
let app = require('./server');
Mongo.connect('mongodb://localhost:27017/test', (err, db)=> {
    if (err) {
        app.throw(500);
    }
    app.context.db = db;
    app.listen(8080);
});
