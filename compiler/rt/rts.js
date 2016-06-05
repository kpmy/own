/* Created by kpmy on 19.05.2016 */
const should = require("should");
const types = rerequire("../ir/types.js")();
const _ = require("underscore");

function Type(tn) {
    const t = this;
    
    t.base = types.find(tn);
    should.exist(t.base);
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

function notImpl(){
    throw new Error("not implemented inside");
}
function Inside(){ //так как селектор не только на чтение но и на запись - проксируем кишки объекта через Inside
    const i = this;

    i.deeper = notImpl;

    i.value = function () {
        i.deeper().value(...arguments);
    };

    i.select = function () {
        i.deeper().select(...arguments);
    };

    i.deref = function () {
        i.deeper().deref(...arguments);
    }
}

function Obj(t, cv) {

    function Local(t) {
        this.type = t;
        this.value = defaultValue(t.base);

        this.set = function (v) {
            should.ok(v instanceof Value);
            this.value = v;
        };

        this.get = function () {
            return this.value;
        }
    }

    const o = this;
    o.val = _.isUndefined(cv) ? new Local(t) : cv;
    o.type = t;

    switch (t.base.name){
        case "INTEGER":
        case "CHAR":
        case "BOOLEAN":
            o.value = function (x) {
                if(!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(o.type.base.name, x.type.name)) {
                        o.val.set(x);
                    } else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.deref = notImpl;
            o.call = notImpl;
            o.select = notImpl;
            break;
        case "ANY":
            o.value = function (x) {
                if (!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(o.type.base.name, "ANY")) {
                        o.val.set(new Value("ANY", x));
                    } else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };

            o.deref = function () {
                should.exist(o.val.get());
                should.ok(o.val.get().value instanceof Value);
                var dv = {
                    "get": function () {
                        return Value.prototype.copyOf(o.val.get().value);
                    },
                    "set": notImpl
                };
                return new Obj(new Type(o.val.get().value.type.name), dv);
            };
            o.call = notImpl;
            o.select = notImpl;
            break;
        case "STRING":
            o.value = function (x) {
                if(!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "STRING")) {
                        o.val.set(x);
                    }  else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.select = function () {
                should.ok(arguments.length == 1); // TODO multiselector
                var a = arguments[0];
                should.ok(_.isEqual(a.type.name, "INTEGER"));
                var idx = a.getNativeValue();
                var sv = {
                    "get": function () {
                        return new Value("CHAR", o.val.get().getNativeValue().charAt(idx), "utf8");
                    },
                    "set": function (x) {
                        should.ok(x instanceof Value);
                        var ch = x.getNativeValue();
                        var old = o.val.get().getNativeValue();
                        o.val.set(new Value("STRING", old.substring(0, idx) + ch + old.substring(idx+1), "utf8"));
                    }
                };
                return new Obj(new Type("CHAR"), sv);
            };
            o.call = notImpl;
            o.deref = notImpl;
            break;
        case "LIST":
            o.value = function (x) {
                if(!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "LIST")) {
                        o.val.set(x);
                    }  else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.select = function () {
                should.ok(arguments.length == 1); // TODO multiselector
                var a = arguments[0];
                should.ok(_.isEqual(a.type.name, "INTEGER"));
                var idx = a.getNativeValue();
                var sv = {
                    "get": function () {
                        return new Value("ANY", o.val.get().value[idx], "utf8");
                    },
                    "set": function (x) {
                        should.ok(x instanceof Value);
                        if(_.isEqual(x.type.name, "ANY")){
                            o.val.get().value[idx] = x.value;
                        } else {
                            o.val.get().value[idx] = x;
                        }
                    }
                };
                return new Obj(new Type("ANY"), sv);
            };
            o.call = notImpl;
            o.deref = notImpl;
            break;
        case "MAP":
            o.value = function (x) {
                if(!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "MAP")) {
                        o.val.set(x);
                    }  else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.select = function () {
                should.ok(arguments.length == 1); // TODO multiselector
                var a = arguments[0];
                var sv = {
                    "find": function(){
                        var ret = Array.from(o.val.get().value)
                            .filter(i => i[0].isValueEqual(a))
                            .concat();
                        should.exist(ret);
                        should.ok(ret.length  == 1);
                        return ret[0];
                    }
                };
                sv.get = function () {
                    return new Value("ANY", sv.find()[1], "utf8")
                };
                sv.set = function (x) {
                    should.ok(x instanceof Value);
                    if(_.isEqual(x.type.name, "ANY")){
                        sv.find()[1] = x.value;
                    } else {
                        sv.find()[1] = x;
                    }
                };
                return new Obj(new Type("ANY"), sv);
            };
            o.call = notImpl;
            o.deref = notImpl;
            break;
        case "BLOCK":
            o.value = function (x) {
                if(!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "BLOCK")) {
                        o.val.set(x);
                    } else if (_.isEqual(x.type.name, "ANY") && _.isNull(x.value)){
                        o.val.set(new Value("BLOCK", null));
                    }  else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.call = function () {
                var f = o.val.get().getNativeValue();
                should.exist(f);
                f(...arguments);
            };
            o.deref = notImpl;
            o.select = notImpl;
            break;
        default: throw new Error(`not supported type ${t}`)
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
        case "BOOLEAN":
        case "LIST":
            ret = v.value;
            break;
        default:
            throw new Error(`unsupported native type ${v.type.name}`);
    }
    should.exist(ret);
    return ret;
};

Value.prototype.copyOf = function (v) {
    should.ok(v instanceof Value);
    var ret = new Value(v.type.name);
    ret.value = v.value;
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

function ValueMath() {
    const m = this;
    m.nativeOp = {
        "+": "+",
        "-": "-",
        "*": "*",
        "|" : "||",
        "&": "&&",
        "~": "!",
        "=": "==",
        "<": "<",
        ">": ">",
        "<=": "<=",
        ">=": ">=",
        "#": "!="
    };

    m.olrmap = {}; //{op : {left type : {right type : result type
    m.olrmap["-"] = m.olrmap["*"] = m.olrmap["+"]= {
        "INTEGER": {
            "INTEGER": "INTEGER"
        }
    };

    m.olrmap["|"] = m.olrmap["&"] = {
        "BOOLEAN": {
            "BOOLEAN": "BOOLEAN"
        }
    };

    m.olrmap["<"] = m.olrmap[">"] = m.olrmap["<="] = m.olrmap[">="] = m.olrmap["#"] = m.olrmap["="] = {
        "INTEGER": {
            "INTEGER": "BOOLEAN"
        }
    };

    m.oemap = {};
    m.oemap["-"] = {
        "INTEGER": "INTEGER"
    };
    m.oemap["~"] = {
        "BOOLEAN": "BOOLEAN"
    };

    m.value = function () {
        return new Value(...arguments);
    };

    m.mop = function (op, v) {
        function val() {
            var ret = v();
            should.ok(ret instanceof Value);
            return ret
        }
        var body = `throw new Error("not implemented")`;
        if (!_.isUndefined(m.nativeOp[op])) {
            body = (`
                const op = "${op}";
                
                var emap = this.oemap[op];
                if(emap === undefined) throw new Error("unknown op "+op);
                
                var val = v();
                var rt = emap[val.type.name];
                if(rt === undefined) throw new Error("unknown expr type "+val.type.name);
           
                if(typeof this.nativeOp[op] == "string") {
                    var ret = ${m.nativeOp[op]}val.getNativeValue();
                } else {
                    throw new Error("not implemented");
                }
                return this.value(rt, ret);
                `);
        } else {
            throw new Error(`not implemented for ${op}`);
        }
        var fn = new Function(`v`, body);
        var mfn = fn.bind(m);
        return mfn(val);
    };

    m.dop = function (lv, op, rv) {
        function left() {
            var ret = lv();
            should.ok(ret instanceof Value);
            return ret
        }
        function right() {
            var ret = rv();
            should.ok(ret instanceof Value);
            return ret
        }
        var body = `throw new Error("not implemented")`;
        if (!_.isUndefined(m.nativeOp[op])) {
            body = (`
                const op = "${op}";
                var left = l();
                
                var lrmap = this.olrmap[op];
                if(lrmap === undefined) throw new Error("unknown op "+op);
                
                var rmap = lrmap[left.type.name];
                if(rmap === undefined) throw new Error("unknown left type "+left.type.name);
                
                if(left.type.name == "BOOLEAN"){ //short boolean ops
                    if(op == "|" && left.getNativeValue())
                        return this.value("BOOLEAN", true);
                    if(op == "&" && !left.getNativeValue())
                        return this.value("BOOLEAN", false);
                }
                
                var right = r();
                
                var rt = rmap[right.type.name];
                if(rt === undefined) throw new Error("unknown right type "+right.type.name);
            
                if(typeof this.nativeOp[op] == "string") {
                    var ret = left.getNativeValue() ${m.nativeOp[op]} right.getNativeValue();
                } else {
                    throw new Error("not implemented");
                }
           
                return this.value(rt, ret);`
                );
        } else {
            throw new Error(`not implemented for ${op}`);
        }
        var fn = new Function(`l`, `r`, body);
        var mfn = fn.bind(m);
        return mfn(left, right);
    }
}

function RTS(pwd) {
    const rts = this;

    rts.Type = Type;
    rts.Obj = Obj;
    rts.Value = Value;

    rts.math = new ValueMath();

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
    
    rts.copyOf = Value.prototype.copyOf;

    rts.isValue = function (x) {
        return x instanceof Value;
    }
}

module.exports = function (pwd) {
    return new RTS(pwd)
};