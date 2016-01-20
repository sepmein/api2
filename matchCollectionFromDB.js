/**
 * Created by Spencer on 16/1/17.
 */
module.exports = function *matchCollectionFromDB(next) {
    "use strict";
    let collectionName = this.collectionName;
    try {
        let result =
            yield new Promise((resolve, reject)=> {
                this.db.listCollections({
                        name: collectionName
                    })
                    .toArray(function (err, items) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(items);
                        }
                    });
            });
        this.assert(result.length, 404);
    } catch (e) {
        console.log(e.stack);
        this.throw(503);
    }
    this.collection = this.db.collection(this.collectionName);
    delete this.collectionName;
    yield next;
};