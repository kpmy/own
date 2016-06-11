/* Created by kpmy on 10.06.2016 */
const should = require("should/as-function");
const _ = require('underscore');

function Qualident(tpl, cls, id) {
    const i = this;
    i.cls = cls;
    i.tpl = tpl;
    i.id = id;
}

function Clazz(tpl, cls) {
    const c = this;
    c.cls = cls;
    c.tpl = tpl;
}

function Leaf() {
    const l = this;
    l.qid = null;
    l.clazz = null;
    l.up = null;
    l.children = [];
    l.unique = false;

    l.push = function (x) {
        if (isLeaf(x))
            x.up = l;

        l.children.push(x);
    }
}

function Value(type, value) {
    const v = this;
    v.value = value;
    v.type = type;
}

let isLeaf = (x) => _.isEqual(x.constructor.name, "Leaf");
let isValue = (x) => _.isEqual(x.constructor.name, "Value");

function Struct() {
    const s = this;
    s.Qualident = Qualident;
    s.Leaf = Leaf;
    s.Clazz = Clazz;
    s.Value = Value;

    s.isLeaf = isLeaf;
    s.isValue = isValue;

    s.run = function (t) {
        var st = [];
        var uids = {};

        var emit = null;
        var reuse = null;
        var ret = null;

        t.forEach((s) => {
            if (s instanceof Emit) {
                emit = function () {
                    var o = null;
                    if (!_.isEmpty(s.id) && uids.hasOwnProperty(s.id))
                        throw new Error(`non unique identifier ${s.id}`);

                    o = new Leaf();
                    o.om = {};
                    o.em = {};
                    o.qid = new Qualident(s.tpl, s.cls, s.id);
                    o.clazz = new Clazz(s.tpl, s.cls);
                    if (!_.isEmpty(o.id))
                        uids[o.id] = o;
                    var parent = _.last(st);
                    if (_.isObject(parent)) {
                        if (!parent.om.hasOwnProperty(s.key()))
                            parent.om[s.key()] = o;

                        if (parent.em.hasOwnProperty(s.key()))
                            throw new Error(`need reuse ${s.key()}`);

                        parent.children.push(o);
                        o.up = parent;
                    } else {
                        ret = o;
                    }
                    if (s.children > 0) {
                        st.push(o);
                    }
                    emit = null;
                    reuse = null;
                    return o;
                };
                reuse = function () {
                    var parent = _.last(st);
                    if (_.isObject(parent)) {
                        var old = parent.em[JSON.stringify(s)];
                        if (_.isObject(old)) {
                            st.push(old);
                        } else if (!parent.om.hasOwnProperty(JSON.stringify(s))) {
                            old = emit();
                            parent.em[JSON.stringify(s)] = old;
                            old.unique = true;
                        } else {
                            throw new Error(`can't reuse ${JSON.stringify(s)}`);
                        }
                    } else {
                        throw new Error("nothing to reuse");
                    }
                    emit = null;
                    reuse = null;
                };
                if (s.children == 0) {
                    should.exist(emit);
                    emit();
                }
            } else if (s instanceof Dive) {
                if (s.map) {
                    should.exist(reuse);
                    reuse();
                } else {
                    should.exist(emit);
                    emit();
                }
            } else if (s instanceof Rise) {
                st.pop();
            } else if (s instanceof Put) {
                var top = _.last(st);
                switch (s.type.name) {
                    case "STRING":
                        top.children.push(new Value(s.type, s.value));
                        break;
                    default:
                        throw new Error(`unknown value with type ${s.type.name}`);
                }
            } else {
                throw new Error(`wrong instruction ${JSON.stringify(s)}`);
            }
        });
        let clear = function (root) {
            delete root["em"];
            delete root["om"];
            if (root.hasOwnProperty("children"))
                root.children.forEach((i) => clear(i));
        };
        clear(ret);
        return ret;
    };
}

module.exports.struct = function () {
    return new Struct();
};

function Emit(tid, cls, id) {
    this.tid = tid;
    this.id = id;
    this.cls = cls;
    this.children = 0;

    this.key = function () {
        return JSON.stringify([this.tid, this.cls, this.id]);
    }
}

function Dive(map) {
    this.map = map;
}

function Put() {
    this.type = null;
    this.value = null;
}

function Rise() {
}

function Instr() {
    const i = this;

    i.Emit = Emit;
    i.Dive = Dive;
    i.Put = Put;
    i.Rise = Rise;
}

module.exports.instr = function () {
    return new Instr();
};