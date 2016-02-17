/**
 * Created by Spencer on 16/1/20.
 */
"use strict";

let is = require('is-js');
let ObjectId = require('mongodb').ObjectID;

function *read(next) {
    console.log('GET called');
    //get single /collection/id
    let paths = this.path.split('/');
    console.log('paths', paths);
    if (paths.length === 3) {
        let id = paths[2];
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
    } else {
        console.log('get batch mode');
        let limit = this.header.limit;
        let skip = this.header.skip;
        let options = {};
        if(limit) {
            options.limit = Number(limit);
        }
        if(skip){
            options.skip = Number(skip);
        }
        console.log('options', options);

        //console.log(this.request.body);
        let result;
        try {
            result = yield this.collection.find(this.request.body, options).toArray();
        } catch (e) {
            this.throw(500);
        }
        if(result.length){
            this.body = result;
        } else {
            this.throw(404);
        }
    }
}

module.exports = read;