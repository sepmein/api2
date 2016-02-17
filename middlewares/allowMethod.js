/**
 * Created by Spencer on 16/2/17.
 */
module.exports = function allowMethod(methods) {
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
};