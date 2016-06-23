/* Created by kpmy on 22.06.2016 */
let _ = require("underscore");
let should = require("should");

let tpl = rerequire("../ir/tpl.js").struct();
let types = rerequire("../ir/types.js")();
let std = rerequire("./std.js")();
let reasoner = rerequire("./reasoner.js");

let Class = rerequire("./class.js");
let ObjectProperty = rerequire("./oprop.js");
let DataProperty = rerequire("./dprop.js");


function Builder(ot) {
    const b = this;
    var classMap = {};

    function Runner(root) {
        let r = this;
        var i = -1;
        r.sym = null;

        r.is = function (x) {
            return r.sym != null && _.isEqual(r.sym.qid.cls, x);
        };

        r.class = function () {
            should.exist(r.sym, "object expected");
            return _.has(std.classes, r.sym.qid.cls) ? std.classes[r.sym.qid.cls] : null;
        };

        r.prop = function () {
            should.exist(r.sym, "prop expected");
            return _.has(std.props, r.sym.qid.cls) ? std.props[r.sym.qid.cls] : null;
        };

        r.next = function () {
            should.ok(i < 0 || !_.isNull(r.sym));
            i++;
            r.sym = i < root.children.length ? root.children[i] : null;
            return r;
        };

        r.next();
    }

    b.dataAtomic = function (r) {
        var ret = null;
        let dt = r.sym;
        if (dt.children.length > 0) { //range or list inside
            if (!dt.unique) { //range
                should.ok(dt.children.length == 2, "range should contain two values");
                var lv = dt.children[0];
                var rv = dt.children[1];
                should.ok(tpl.isValue(lv) && tpl.isValue(rv));
                switch (dt.qid.cls) {
                    case types.INTEGER.name:
                        should.ok(_.isEqual(lv.type.name, types.INTEGER.name));
                        should.ok(_.isEqual(rv.type.name, types.INTEGER.name));
                        ret = function () {
                            reasoner.datarange(types.INTEGER, lv.value, rv.value);
                        };
                        break;
                    default:
                        throw new Error(`unknown datatype`);
                }
            } else { //list
                throw new Error(`not implemented`);
            }
        } else {
            throw new Error(`unknown data`);
        }
        return ret;
    };

    b.dataPrimary = function (r) {
        b.dataAtomic(r);
    };

    b.atomic = function (r) {
        should.ok(r.class(), "class ident expected");
        var cls = r.class();
        r.next();
        return function () {
            reasoner.refer(cls);
        };
    };

    b.dprop = function (r) {
        let rs = r.prop();
        let q = r.next().sym;
        should.exist(q);
        switch (q.qid.cls) {
            case "exactly":
                var card = r.next().sym;
                should.ok(tpl.isValue(card) && _.isEqual(card.type.name, types.INTEGER.name));
                r.next();
                return function () {
                    reasoner.cardinal(rs, card.value);
                };
                break;
            case "some":
                r.next();
                return b.dataPrimary(r);
                break;
            default:
                throw new Error(`unknown property quantum ${q.qid.cls}`);
        }
    };

    b.restriction = function (r) {
        if (r.prop()) {
            let rs = r.prop();
            if (is(rs).type(DataProperty)) {
                return b.dprop(r);
            } else {
                throw new Error(`unknown property type`);
            }
        } else {
            throw new Error(`unsupported restriction ${r.sym.qid.cls}`)
        }
    };

    b.primary = function (r) {
        var cond = null;
        if (r.class()) {
            cond = b.atomic(r);
        } else {
            cond = b.restriction(r);
        }

        return cond;
    };

    b.and = function (r) {
        var ret = null;
        if (r.class()) {
            ret = b.atomic(r);
        } else {
            var cond = [b.primary(r)];
            while (r.is("AND")) {
                r.next();
                cond.push(b.primary(r));
            }
            ret = function () {
                reasoner.and(cond);
            }
        }
        return ret;
    };

    b.or = function (r) {
        var cond = b.and(r);

        return cond;
    };

    b.run = function (clazz, root) {
        root.children.forEach(c => {
            switch (c.qid.cls) {
                case "SubClassOf":
                    var fn = b.or(new Runner(c));
                    should.exist(fn);
                    clazz.description.push(fn);
                    break;
                default:
                    throw new Error(`unknown class ${c.qid.cls}`);
            }
        });
    };

    b.build = function () {
        b.run(classMap["$"], ot);
        return classMap["$"];
    };

    classMap["$"] = new Class();
}

function build(ot) {
    return new Builder(ot).build();
}

module.exports.build = build;