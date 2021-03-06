/* Created by kpmy on 19.05.2016 */
const should = require("should");
const _ = require("underscore");

const types = require("./ir/types.js")();
const tpl = require("./ir/tpl.js").struct();
const owl2 = require("./owl2");

function Type(tn, id, value) {
    const t = this;

    if (_.isEqual(tn, "USER")) {
        should.ok(value instanceof Value);
        should.ok(_.isEqual(value.type.name, "TYPE"));
        t.base = types.userType(id);
        //t.base.value = value.value;
        t.base.class = owl2.build(value.value);
        t.base.class.IRI = id;
        t.base.type = null;
    } else {
        t.base = types.find(tn);
    }
    should.exist(t.base);
}

function defaultValue(t) {
    var ret = null;
    var id = undefined;
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
        case "SET":
            ret = [];
            break;
        case "BLOCK":
            ret = null;
            break;
        case "TYPE":
            ret = null;
            break;
        case "ATOM":
            ret = null;
            break;
        case "USER":
            ret = null;
            id = t.id;
            break; //TODO fix this default value
        case "POINTER":
            ret = null;
            break;
        default:
            throw new Error(`unknown default value for type ${t.name}`);
    }
    return new Value(t.name, ret, "utf8", id);
}

function notImpl(){
    throw new Error("not implemented inside");
}

function Const(v) {
    const c = this;
    c.val = v;

    c.value = function () {
        return c.val;
    }
}

function Obj(t, cv) {

    function Local(t) {
        //this.type = t;
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
        case "ATOM":
            o.value = function (x) {
                if (!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "ATOM")) {
                        o.val.set(new Value("ATOM", x.value))
                    } else if (_.isEqual(x.type.name, "ANY") && _.isNull(x.value)) {
                        o.val.set(new Value("ATOM", null));
                    } else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };

            o.call = notImpl;
            o.select = notImpl;
            o.deref = notImpl;
            break;
        case "ANY":
            o.value = function (x) {
                if (!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    o.val.set(new Value("ANY", x));
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
            o.cast = function (t) {
                should.ok(t instanceof Value);
                should.ok(_.isEqual(t.type.name, "TYPE"));
                should.ok(_.isEqual(t.value.name, o.val.get().value.type.name));
                var cv = {
                    get: function () {
                        return Value.prototype.copyOf(o.val.get().value);
                    },
                    set: notImpl
                };
                return new Obj(new Type(t.value.name), cv);
            };
            break;
        case "POINTER":
            o.value = function (x) {
                if (!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "POINTER")) {
                        o.val.set(new Value("POINTER", x.value));
                    } else {
                        should.ok(o.val.get().value.adr > 0);
                        o.val.get().value.obj.value(x);
                    }
                }
                return o.val.get();
            };
            o.call = notImpl;
            o.select = notImpl;
            o.deref = notImpl;
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
        case "SET":
            o.value = function (x) {
                if (!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "SET")) {
                        o.val.set(x);
                    } else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.select = o.call = o.deref = notImpl;
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
        case "TYPE":
            o.value = function (x) {
                if (!(_.isNull(x) || _.isUndefined(x))) {
                    should.ok(x instanceof Value);
                    if (_.isEqual(x.type.name, "TYPE")) {
                        o.val.set(x);
                    } else if (_.isEqual(x.type.name, "ANY") && _.isNull(x.value)) {
                        o.val.set(new Value("TYPE", null));
                    } else {
                        throw new Error(`types don't match ${o.type.base.name} ${x.type.name}`)
                    }
                }
                return o.val.get();
            };
            o.call = notImpl;
            o.deref = notImpl;
            o.select = notImpl;
            break;
        case "USER":
            var base = owl2.macro(t.base.class).getBaseClass();
            should.exist(base);
            t.base.type = new Type(base.IRI);
            o.ref = new Obj(t.base.type, o.val);

            o.value = function (x) {
                return o.ref.value(x);
            };

            o.call = notImpl;
            o.deref = notImpl;
            o.select = notImpl;
            break;
        default:
            throw new Error(`not supported type ${t.base.name} user type ${t.base.id}`);
    }
}

function Value(tn, val, enc, userType) {
    const v = this;
    if (_.isUndefined(userType)) {
        v.type = types.find(tn);
        should.exist(v.type);
    } else {
        v.type = types.userType(userType);
    }

    v.value = null;

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
        case "POINTER":
            ret = v.value;
            break;
        case "MAP":
            ret = {};
            for (var i = 0; i < v.value.length; i++) {
                var k = v.value[i][0].getNativeValue();
                var x = v.value[i][1].getNativeValue();
                should.ok(typeof k == "string");
                ret[k] = x;
            }
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
                case "ATOM":
                    ret = _.isEqual(this.value, that.value);
                    break;
                default:
                    throw new Error(`equality not supported ${this.type.name}`);
            }
        }
    }
    return ret;
};

Value.prototype.isTypeEqual = function (that) {
    should.ok(that instanceof Value);
    return true;
};

function ValueMath() {
    const m = this;
    m.op = {
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
    m.olrmap["+"] = {
        "INTEGER": {
            "INTEGER": {type: "INTEGER"}
        },
        "STRING": {
            "STRING": {type: "STRING", fn: (l, r) => l.concat(r)},
            "CHAR": {type: "STRING", fn: (l, r) => l.concat(r)}
        },
        "CHAR": {
            "STRING": {type: "STRING", fn: (l, r) => l.concat(r)},
            "CHAR": {type: "STRING", fn: (l, r) => l.concat(r)}
        }
    };

    m.olrmap["-"] = {
        "INTEGER": {
            "INTEGER": {type: "INTEGER"}
        }
    };

    m.olrmap["*"] = {
        "INTEGER": {
            "INTEGER": {type: "INTEGER"}
        }
    };

    m.olrmap["|"] = m.olrmap["&"] = {
        "BOOLEAN": {
            "BOOLEAN": {type: "BOOLEAN"}
        }
    };

    m.olrmap["<"] = {
        "INTEGER": {
            "INTEGER": {type: "BOOLEAN"}
        },
        "STRING": {
            "STRING": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) < 0}
        },
        "CHAR": {
            "CHAR": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) < 0}
        }
    };

    m.olrmap[">"] = {
        "INTEGER": {
            "INTEGER": {type: "BOOLEAN"}
        },
        "STRING": {
            "STRING": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) > 0}
        },
        "CHAR": {
            "CHAR": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) > 0}
        }
    };

    m.olrmap["<="] = {
        "INTEGER": {
            "INTEGER": {type: "BOOLEAN"}
        },
        "STRING": {
            "STRING": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) <= 0}
        },
        "CHAR": {
            "CHAR": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) <= 0}
        }
    };

    m.olrmap[">="] = {
        "INTEGER": {
            "INTEGER": {type: "BOOLEAN"}
        },
        "STRING": {
            "STRING": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) >= 0}
        },
        "CHAR": {
            "CHAR": {type: "BOOLEAN", fn: (l, r) => l.localeCompare(r) >= 0}
        }
    };

    m.olrmap["#"] = {
        "INTEGER": {
            "INTEGER": {type: "BOOLEAN"}
        },
        "STRING": {
            "STRING": {type: "BOOLEAN", fn: (l, r) => !_.isEqual(l, r)}
        },
        "CHAR": {
            "CHAR": {type: "BOOLEAN", fn: (l, r) => !_.isEqual(l, r)}
        },
        "POINTER": {
            "POINTER": {type: "BOOLEAN", fn: (l, r) => !_.isEqual(l.adr, r.adr)}
        }
    };

    m.olrmap["="] = {
        "INTEGER": {
            "INTEGER": {type: "BOOLEAN"}
        },
        "STRING": {
            "STRING": {type: "BOOLEAN", fn: _.isEqual}
        },
        "CHAR": {
            "CHAR": {type: "BOOLEAN", fn: _.isEqual}
        }
    };

    m.oemap = {};
    m.oemap["-"] = {
        "INTEGER": {type: "INTEGER"}
    };
    m.oemap["~"] = {
        "BOOLEAN": {type: "BOOLEAN"}
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
        if (!_.isUndefined(m.op[op])) {
            body = (`
                const op = "${op}";
                
                var emap = this.oemap[op];
                if(emap === undefined) throw new Error("unknown op "+op);
                
                var val = v();
                var rt = emap[val.type.name];
                if(rt === undefined) throw new Error("unknown expr type "+val.type.name);
                
                var ret = (rt.fn === undefined) ? (function(x){
                    return ${m.op[op]}x;
                }) : rt.fn
                
                return this.value(rt.type, ret(val.getNativeValue()));
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

        var mfn = null;

        if (!_.isUndefined(m.op[op])) {
            var body = (`
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
            
                var ret = (rt.fn === undefined) ? (function(lv, rv){
                    return lv${m.op[op]}rv;
                }) : rt.fn;
               
                return this.value(rt.type, ret(left.getNativeValue(), right.getNativeValue()));`
            );
            var fn = new Function(`l`, `r`, body);
            mfn = fn.bind(m);
        } else if (_.isEqual(op, "IS")) {
            mfn = function (left, right) {
                var test = left();
                var typ = right();
                if (_.isEqual(typ.type.name, "TYPE")) {
                    return m.value("BOOLEAN", _.isEqual(test.type.name, typ.value.name));
                } else {
                    throw new Error("strange type of IS")
                }
            };
        } else {
            throw new Error(`not implemented for ${op}`);
        }
        should.exist(mfn);
        return mfn(left, right);
    }
}

function Std(rts) {
    const std = this;

    var next = 0;
    std.nextInt = function () {
        next++;
        return next;
    };

    std.$INC = function (x) {
        should.ok(x instanceof Obj);
        should.ok(x.type.base.name == "INTEGER");
        var i = x.value().getNativeValue();
        x.value(new Value("INTEGER", i + 1))
    };

    std.$DEC = function (x) {
        should.ok(x instanceof Obj);
        should.ok(x.type.base.name == "INTEGER");
        var i = x.value().getNativeValue();
        x.value(new Value("INTEGER", i - 1));
    };

    std.$ORD = function (res, ch) {
        should.ok(res instanceof Obj);
        should.ok(ch instanceof Value);
        should.ok(res.type.base.name == "INTEGER");
        should.ok(ch.type.name == "CHAR");
        var c = ch.getNativeValue();
        res.value(new Value("INTEGER", c.charCodeAt(0)))
    };

    std.$TYPEOF = function (res, o) {
        should.ok(res instanceof Obj);
        should.ok(o instanceof Value);
        should.ok(res.type.base.name == "TYPE");
        if (o.type.name == "ANY") {
            if (_.isNull(o.value)) {
                res.value(new Value("TYPE", null))
            } else {
                res.value(new Value("TYPE", o.value.type));
            }
        } else {
            res.value(new Value("TYPE", o.type));
        }
    };

    std.$ASSERT = function (cond, code) {
        should.ok(cond instanceof Value);
        should.ok(code instanceof Value);
        should.ok(cond.type.name == "BOOLEAN");
        if (!cond.getNativeValue())
            throw new Error(`assert violated ${code.getNativeValue()}`);
    };

    std.$NEW = function (x) {
        should.ok(x instanceof Obj);
        should.ok(x.type.base.name == "POINTER");
        var p = new Value("POINTER", {
            adr: std.nextInt(),
            obj: new Obj(new Type("ANY"))
        });
        x.value(p);
    };

    std.handle = function (e) {
        switch (e.type) {
            case "load":
                rts.load(e.name);
                break;
            default:
                throw new Error(`unknown message type ${e.type}`);
        }
    };

    std.$HANDLE = function (msg, res) {
        should.ok(msg instanceof Value);
        should.ok(msg.type.name == "MAP");
        std.handle(msg.getNativeValue());
    };

    std.start = function () {
    }
}

function RTS(pwd) {
    const rts = this;

    rts.Type = Type;
    rts.Obj = Obj;
    rts.Value = Value;
    rts.Const = Const;

    rts.math = new ValueMath();
    rts.types = types;
    rts.tpl = tpl;

    rts.pwd = pwd;
    rts.modules = [];
    rts.modulesCache = {};

    rts.load = function (name) {
        if(rts.modulesCache.hasOwnProperty(name)){
            return rts.modulesCache[name];
        }
        //console.log(`rts.load ${name}`);
        var mod = _.isEqual(name, "$std") ? new Std(rts) : rerequire(pwd + "/" + name + ".js")(rts); // рекурсивно вызывает rts.load для импортов
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
    };

    rts.getNative = function (t, v) {
        should.ok(v instanceof Value);
        var x = v.getNativeValue();
        should.ok(_.isEqual(typeof x, t));
        return x;
    };
}

module.exports = function (pwd) {
    return new RTS(pwd)
};