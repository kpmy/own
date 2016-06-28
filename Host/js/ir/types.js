/* Created by kpmy on 17.05.2016 */
const should = require("should");
const _ = require("underscore");

global.NONE = {};

function Type(name, parse) {
    let t = this;

    if (parse)
        t.parse = parse;
    else
        t.parse = (x) => x;

    t.name = name;
}


function Types() {
    const t = this;

    let map = {
        "INTEGER": t.INTEGER = new Type("INTEGER", function (x) {
            if (typeof x == "string")
                return parseInt(x, 10);

            if (typeof x == "number")
                return x;

            throw new Error(`unknown int value ${x}`);
        }),
        "ANY": t.ANY = new Type("ANY", function (x) {
            var ret;
            if (_.isEqual(x, global.NONE)) {
                ret = null;
            } else {
                ret = x;
            }
            return ret;
        }),
        "BOOLEAN": t.BOOLEAN = new Type("BOOLEAN", function (x) {
            if (typeof x == "string") {
                var v = x.toUpperCase();
                should.ok(_.isEqual(v, "TRUE") || _.isEqual(v, "FALSE"));
                return _.isEqual(v, "TRUE");
            }

            if (typeof x == "boolean")
                return x;

            throw new Error(`unknown bool value ${x}`);
        }),
        "TRILEAN": t.TRILEAN = new Type("TRILEAN", function (x) {
            if (_.isNull(x)) {
                return null;
            } else if (typeof x == "boolean") {
                return x;
            }
            throw new Error(`unknown tril value ${x}`);
        }),
        "POINTER": t.POINTER = new Type("POINTER"),
        "STRING": t.STRING = new Type("STRING", function (x) {
            if (typeof x == "string") {
                return x;
            }

            throw new Error(`unknown str value ${x}`);
        }),
        "CHAR": t.CHAR = new Type("CHAR", function (x) {
            if (typeof x == "string") {
                return x;
            }

            throw new Error(`unknown char value ${x}`);
        }),
        "MAP": t.MAP = new Type("MAP", function (x) {
            if (_.isArray(x)) {
                return x;
            }

            throw new Error(`unknown map value ${x}`);
        }),
        "LIST": t.LIST = new Type("LIST", function (x) {
            if (_.isArray(x)) {
                return x;
            }

            throw new Error(`unknown list value ${x}`);
        }),
        "SET": t.SET = new Type("SET", function (x) {
            if (_.isArray(x)) {
                return x;
            }

            throw new Error(`unknown set value ${x}`);
        }),
        "BLOCK": t.BLOCK = new Type("BLOCK", function (x) {
            if (typeof x == "string") {
                return x;
            }

            if (typeof x == "function") {
                return x;
            }
            throw new Error(`unknown block value ${x}`);
        }),
        "TYPE": t.TYPE = new Type("TYPE", function (x) {
            var ret;
            if (_.isEqual(x, global.NONE)) {
                ret = null;
            } else {
                ret = x;
            }

            return ret;
        }),
        "ATOM": t.ATOM = new Type("ATOM", function (x) {
            var ret;
            if (_.isEqual(x, global.NONE)) {
                ret = null;
            } else if (typeof x == "string") {
                ret = x;
            } else if (_.isObject(x) && (x.constructor.name == "Leaf")) {
                ret = x;
            } else {
                throw new Error(`unknown atom value ${x}`);
            }

            return ret;
        })
    };

    t.find = function (t) {
        var ret = map.hasOwnProperty(t) ? map[t] : null;
        return ret;
    };

    t.userType = function (id) {
        var ret = new Type("USER");
        ret.id = id;
        ret.value = null;
        ret.class = null;
        return ret;
    }
}

module.exports = function () {
    return new Types();
};