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
            ret = [];
            break;
        case "LIST":
            ret = [];
            break;
        case "BLOCK":
            ret = null;
            break;
        default:
            throw new Error(`unknown default value for type ${t.name}`);
    }
    return new Value(t.name, ret, "utf8");
}

function Inside(t){ //так как селектор не только на чтение но и на запись - проксируем кишки объекта через Inside
    const i = this;

    i.type = t;
    i.value = function(){
        throw new Error("not implemented inside");
    }
}

function Obj(t) {
    const o = this;
    
    o.type = t;
    o.val = defaultValue(t.type);
    
    o.value = function (x) {
        if(!(_.isNull(x) || _.isUndefined(x))){
            should.ok(x instanceof Value);
            if(_.isEqual(o.type.type.name, "ANY")) {
                o.val = new Value("ANY", x, "utf8");
            } else if (_.isEqual(o.type.type.name, "BLOCK") && _.isEqual(x.type.name, "ANY") && _.isNull(x.value)){
                o.val = new Value("BLOCK", null);
            } else {
                o.val = x;
            }
        }
        
        return o.val;
    };

    o.select = function(){
        should.ok(arguments.length == 1); // TODO multiselector
        var a = arguments[0];
        var ret = null;
        switch (o.type.type.name){
            case "STRING":
                should.ok(_.isEqual(a.type.name, "INTEGER"));
                var idx = a.getNativeValue();
                ret = new Inside(new Type("CHAR"));
                ret.value = function(x){
                    if(!(_.isNull(x) || _.isUndefined(x))) {
                        should.ok(x instanceof Value);
                        var ch = x.getNativeValue();
                        var old = o.val.getNativeValue();
                        o.val = new Value("STRING", old.substring(0, idx) + ch + old.substring(idx+1), "utf8"); //TODO проверить на всех входных значениях
                    }
                    return new Value("CHAR", o.val.getNativeValue().charAt(idx), "utf8");
                };
                break;
            case "LIST":
                should.ok(_.isEqual(a.type.name, "INTEGER"));
                var idx = a.getNativeValue();
                ret = new Inside(new Type("ANY"));
                ret.value = function(x){
                    if(!(_.isNull(x) || _.isUndefined(x))) {
                        should.ok(x instanceof Value);
                        if(_.isEqual(x.type.name, "ANY")){
                            o.val.value[idx] = x.value;
                        } else {
                            o.val.value[idx] = x;
                        }
                    }
                    return new Value("ANY", o.val.value[idx], "utf8");
                };
                break;
            case "MAP":
                ret = new Inside(new Type("ANY"));
                ret.find = function(){
                    var ret = Array.from(o.val.value)
                        .filter(i => i[0].isValueEqual(a))
                        .concat();
                    should.exist(ret);
                    should.ok(ret.length  == 1);
                    return ret[0];
                };
                ret.value = function(x){
                    if(!(_.isNull(x) || _.isUndefined(x))) {
                        should.ok(x instanceof Value);
                        if(_.isEqual(x.type.name, "ANY")){
                            ret.find()[1] = x.value;
                        } else {
                            ret.find()[1] = x;
                        }
                    }
                    return new Value("ANY", ret.find()[1], "utf8");
                };
                break;
            default:
                throw new Error(`unsupported selection ${o.type.type.name}`);
        }
        should.exist(ret);
        return ret;
    };

    o.call = function(){
        should.ok(_.isEqual(o.type.type.name, "BLOCK"));
        var f = o.val.getNativeValue();
        should.exist(f);
        f(...arguments);
    }
}

function Value(tn, val, enc) {
    const v = this;
    
    v.type = types.find(tn);
    v.value = null;
    should.exist(v.type);

    if(_.isUndefined(enc))
        enc = "utf8";

    if(!(_.isNull(val) || _.isUndefined(val))) {
        if(_.isEqual(enc, "utf8")){
            if((val instanceof Value) && _.isEqual(tn, "ANY")){
                if(_.isEqual(val.type.name, "ANY")){
                    val = val.value;
                }
            }
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

Value.prototype.getNativeValue = function(){
    const v = this;
    var ret = null;
    switch (v.type.name){
        case "INTEGER":
        case "STRING":
        case "CHAR":
        case "BLOCK":
        case "LIST":
            ret = v.value;
            break;
        default:
            throw new Error(`unsupported native type ${v.type.name}`);
    }
    should.exist(ret);
    return ret;
};

Value.prototype.isValueEqual = function(that){
    should.ok(that instanceof Value);
    var ret = true;
    ret = _.isEqual(this.type.name, that.type.name);
    if(ret){
        if (_.isEqual(this.type.name, "ANY")){
            ret = _.isNull(this.value) ? _.isNull(that.value) : this.value.isValueEqual(that.value);
        } else {
            switch (this.type.name){
                case "STRING":
                    ret = _.isEqual(this.getNativeValue(), that.getNativeValue());
                    break;
                default:
                    throw new Error(`equality not supported ${this.type.name}`);
            }
        }
    }
    return ret;
};

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