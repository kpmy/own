/**
 * Created by petry_000 on 17.05.2016.
 */

function Type(name, parse) {
    let t = this;
    
    if(parse)
        t.parse = parse;
    else
        t.parse = function (x) {
            return x;
        };
    
    t.name = name;
}


function Types() {
    const t = this;
    
    let map = {
        "INTEGER": t.INTEGER = new Type("INTEGER", function (x) {
            return parseInt(x, 10);
        }),
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