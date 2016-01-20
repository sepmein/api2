/**
 * Created by Spencer on 16/1/20.
 */
"use strict";

let is = require('is-js');
let ObjectId = require('mongodb').ObjectID;

function *del(next){
    console.log('DELETE called');
    //delete single /collection/id
    let paths = this.path.split('/');
    console.log('paths', paths);
    if (paths.length === 3) {
        let id = paths[2];
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
    } else {
        console.log('delete batch mode');

        let deleteOpResult;
        try {
            deleteOpResult = yield this.collection.deleteMany(this.request.body);
        } catch (e) {
            this.throw(500);
        }
        let result = deleteOpResult.result;
        if(result.ok){
            this.body = deleteOpResult;
        } else {
            this.throw(400, 'delete failed');
        }
    }}

module.exports = del;