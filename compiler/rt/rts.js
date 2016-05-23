/**
 * Created by petry_000 on 19.05.2016.
 */
const should = require("should");
const types = rerequire("../ir/types.js")();

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
        default:
            throw new Error(`unknown default value for type ${t.name}`);
    }
    return ret;
}

function Obj(t) {
    const o = this;
    
    o.type = t;
    o.value = defaultValue(t.type);
}

function Value(tn, val) {
    const v = this;
    
    v.type = types.find(tn);
    should.exist(v.type);
    if(val)
        v.value = v.type.parse(val);
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
        var ret = new Value(v.type.name);
        ret.value = v.value;
        return ret;
    };
}

module.exports = function (pwd) {
    return new RTS(pwd)
};