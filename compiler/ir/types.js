/**
 * Created by petry_000 on 17.05.2016.
 */
const should = require("should");
const _ = require("underscore");

global.NONE = "ENONEULAV";

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
            if(typeof x == "string")
                return parseInt(x, 10);

            if(typeof x == "number")
                return x;

            throw new Error(`unknown int value ${x}`);
        }),
        "ANY": t.ANY = new Type("ANY", function (x) {
            var ret;
            if(_.isEqual(x, global.NONE)){
                ret = null;
            } else {
                ret = x;
            }
            return ret;
        }),
        "BOOLEAN": t.BOOLEAN = new Type("BOOLEAN", function (x) {
            if(typeof x == "string") {
                var v = x.toUpperCase();
                should.ok(_.isEqual(v, "TRUE") || _.isEqual(v, "FALSE"));
                return _.isEqual(v, "TRUE");
            }

            if(typeof x == "boolean")
                return x;

            throw new Error(`unknown bool value ${x}`);
        })
    };
    
    t.find = function (t) {
        //console.log("find type", t);
        return map.hasOwnProperty(t) ? map[t] : null;
    }
}

module.exports = function () {
    return new Types();
};