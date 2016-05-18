/**
 * Created by petry_000 on 17.05.2016.
 */

function Type(name) {
    let t = this;
    
    t.name = name;
}
Type.prototype.name = null;

function Types() {
    const t = this;
    
    let map = {
        "INTEGER": t.INTEGER = new Type("INTEGER"),
        "ANY": t.ANY = new Type("ANY")
    };
    
    t.find = function (t) {
        console.log("find type", t);
        return map.hasOwnProperty(t) ? map[t] : null;
    }
}

module.exports = function () {
    return new Types();
};