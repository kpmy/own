/**
 * Created by petry_000 on 19.05.2016.
 */
const should = require("should");
const types = rerequire("../ir/types.js")();
const _ = require("underscore");

function Type(tn) {
    const t = this;
    
    t.type = types.find(tn);
    should.exist(t.type);
}

function defaultValue(t) {
    var ret = null;
    switch (t.name){
        case "INTEGER":
            ret = 0;
            break;
        case "ANY":
            ret = null;
            break;
        case "BOOLEAN":
            ret = false;
            break;
        case "STRING":
            ret = "";
            break;
        case "CHAR":
            ret = "";
            break;
        case "MAP":
            ret = {};
            break;
        case "LIST":
            ret = [];
            break;
        default:
            throw new Error(`unknown default value for type ${t.name}`);
    }
    return new Value(t.name, ret, "utf8");
}

function Obj(t) {
    const o = this;
    
    o.type = t;
    o.val = defaultValue(t.type);
    
    o.value = function (x) {
        if(!(_.isNull(x) || _.isUndefined(x))){
            should.ok(x instanceof Value);
            o.val = x;
        }
        
        return o.val;
    }
}

function Value(tn, val, enc) {
    const v = this;
    
    v.type = types.find(tn);
    should.exist(v.type);
    if(!(_.isNull(val) || _.isUndefined(val))) {
        if(_.isEqual(enc, "utf8")){
            //do nothing
        } else if (_.isEqual(enc, "base64")) {
            val = new Buffer(val, enc).toString("utf8");
        } else if (_.isEqual(enc, "charCode")){
            val = String.fromCharCode(val);
        } else {
            throw new Error(`unknown value encoding ${enc}`);
        }
        v.value = v.type.parse(val);
    }
}


function RTS(pwd) {
    const rts = this;

    rts.Type = Type;
    rts.Obj = Obj;
    rts.Value = Value;

    rts.pwd = pwd;
    rts.modules = [];
    rts.modulesCache = {};

    rts.load = function (name) {
        if(rts.modulesCache.hasOwnProperty(name)){
            return rts.modulesCache[name];
        }
        console.log(`load ${name}`);
        var mod = rerequire(pwd + "/" + name + ".js")(rts); // рекурсивно вызывает rts.load для импортов
        should.exist(mod);
        rts.modules.push(mod);
        rts.modulesCache[name] = mod;
        mod.start();
        return mod;
    };

    rts.dump = function () {
        rts.modules.forEach(m => {
            console.dir(m, {depth: null});
        })
    };
    
    rts.copyOf = function (v) {
        should.ok(v instanceof Value);
        var ret = new Value(v.type.name);
        ret.value = v.value;
        return ret;
    };

    rts.isValue = function (x) {
        return x instanceof Value;
    }
}

module.exports = function (pwd) {
    return new RTS(pwd)
};