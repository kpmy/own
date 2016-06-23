/* Created by kpmy on 13.05.2016 */
const should = require("should");
const xml = require("xml");
const _ = require('underscore');

const ast = rerequire("./ast.js");
const tpl = rerequire("./tpl.js").struct();
const types = rerequire("./types.js")();

function Writer(mod) {
    const w = this;

    w.tpl = function (t, root) {
        var attrs = {};
        if (!_.isUndefined(t.qid.tpl)) attrs.tpl = t.qid.tpl;
        if (!_.isUndefined(t.qid.cls)) attrs.cls = t.qid.cls;
        if (!_.isUndefined(t.qid.id)) attrs.id = t.qid.id;
        if (t.unique) attrs.unique = t.unique;
        var tn = xml.element({_attr: attrs});
        root.push({"ot:object": tn});
        t.children.forEach(v => {
            if (tpl.isLeaf(v)) {
                w.tpl(v, tn);
            } else if (tpl.isValue(v)) {
                var attrs = {type: v.type.name};
                switch (v.type.name) {
                    case "STRING":
                        tn.push({"ot:value": [{_attr: attrs}, v.value]});
                        break;
                    case "INTEGER":
                        tn.push({"ot:value": [{_attr: attrs}, v.value]});
                        break;
                    default:
                        throw new Error(`unknown child type ${JSON.stringify(v.type.name)}`);
                }
            } else {
                throw new Error(`unknown child type ${v.constructor.name}`);
            }
        });
        tn.close();
    };

    w.sel = function (s, root) {
        var attrs = {
            "module": s.module,
            "name": s.name
        };
        if(!_.isNull(s.block)){
            attrs.block = s.block;
        }
        var sel = xml.element({_attr: attrs});
        root.push({"selector": sel});
        Array.from(s.inside)
            .forEach(e => {
                w.expr2(e, sel);
            });
        sel.close();
    };

    w.param = function (p, root) {
        w.expr(p.expression, "parameter", root);
    };

    w.map = function(m, root){
        Array.from(m)
            .forEach(e => {
                should.ok(e.length == 2);
                w.expr(e[0], "key", root);
                w.expr(e[1], "value", root);
            });
    };

    w.list = function(l, root){
        Array.from(l)
            .forEach(i => {
                w.expr(i, "item", root);
            })
    };

    w.expr2 = function (e, root) {
        if (is(e).type("ConstExpr")) {
            switch (e.type.name){
                case "STRING":
                case "INTEGER":
                case "CHAR":
                case "BOOLEAN":
                case "ANY":
                case "BLOCK":
                case "POINTER":
                    var attrs = {"type": e.type.name};
                    var val = e.value.toString();
                    should.exist(val);
                    root.push({"constant-expression": [{_attr: attrs}, val]});
                    break;
                case "ATOM":
                    var attrs = {"type": e.type.name};
                    if (_.isObject(e.structure)) {
                        attrs.structured = true;
                        var con = xml.element({_attr: attrs});
                        root.push({"constant-expression": con});
                        w.tpl(e.structure, con);
                        con.close();
                    } else {
                        attrs.structured = false;
                        var val = e.value.toString();
                        root.push({"constant-expression": [{_attr: attrs}, val]});
                    }
                    break;
                case "TYPE":
                    var attrs = {"type": e.type.name};
                    var type = xml.element({_attr: attrs});
                    root.push({"constant-expression": type});
                    if (is(e.value).type("Type")) { //builtin type
                        root.push(e.value.name);
                    } else {
                        w.tpl(e.value, type);
                    }
                    type.close();
                    break;
                case "MAP":
                    var attrs = {"type": e.type.name};
                    var val = xml.element({_attr: attrs});
                    root.push({"constant-expression": val});
                    w.map(e.value, val);
                    val.close();
                    break;
                case "LIST":
                case "SET":
                    var attrs = {"type": e.type.name};
                    var val = xml.element({_attr: attrs});
                    root.push({"constant-expression": val});
                    w.list(e.value, val);
                    val.close();
                    break;
                default:
                    throw new Error(`unknown value ${e.type.name}`);
            }

        } else if (is(e).type("CallExpr")) {
            var attrs = {"module": e.module, "name": e.name};
            var call = xml.element({_attr: attrs});
            root.push({"call-expression": call});
            e.params.forEach(x => {
                w.param(x, call);
            });
            call.close();
        } else if (is(e).type("SelectExpr")) {
            var sel = xml.element();
            root.push({"select-expression": sel});
            w.sel(e.selector, sel);
            sel.close();
        } else if (is(e).type("DerefExpr")) {
            root.push({"deref-expression": {}})
        } else if (is(e).type("DotExpr")) {
            var o = {};
            if (!_.isNull(e.value)) {
                o = [o, e.value];
            }
            root.push({"dot-expression": o})
        } else if (is(e).type("DyadicOp")) {
            var op = xml.element({_attr: {"op": e.op}});
            root.push({"dyadic-op": op});
            w.expr(e.left, "left", op);
            w.expr(e.right, "right", op);
            op.close();
        } else if (is(e).type("MonadicOp")) {
            var op = xml.element({_attr: {"op": e.op}});
            root.push({"monadic-op": op});
            w.expr(e.expr, "expression", op);
            op.close();
        } else if (is(e).type("InfixExpr")) {
            var inf = xml.element({_attr: {"arity": e.arity}});
            root.push({"infix-expression": inf});
            if (!_.isNull(e.expression)) {
                w.expr(e.expression, "expression", inf);
            } else if (!_.isNull(e.selector)) {
                w.sel(e.selector, inf)
            }
            e.params.forEach(x => {
                w.expr(x, "param", inf);
            });
            inf.close();
        } else if (is(e).type("WildcardExpr")) {
            root.push({"wildcard-expression": {}});
        } else if (is(e).type("CastExpr")) {
            w.expr(e.expression, "cast-expression", root);
        } else {
            throw new Error("unexpected expression " + e.constructor.name);
        }
    };

    w.expr = function (e, name, root) {
        var ex = xml.element();
        var o = {};
        o[name] = ex;
        root.push(o);
        w.expr2(e, ex);
        ex.close();
    };

    w.branch = function (b, root) {
        var el = xml.element();
        root.push({"branch": el});
        if (b.multiple) {
            b.condition.forEach(x => w.expr(x, "condition", el));
        } else {
            w.expr(b.condition, "condition", el);
        }
        b.sequence.forEach(s => {
            w.stmt(s, el);
        });
        el.close();
    };

    w.stmt = function (s, root) {
        if (is(s).type("Assign")) {
            var ass = xml.element();
            root.push({"assign": ass});
            w.expr(s.expression, "expression", ass);
            w.sel(s.selector, ass);
            ass.close();
        } else if (is(s).type("Call")) {
            var call = xml.element();
            root.push({"call": call});
            if (!_.isNull(s.expression)) {
                w.expr(s.expression, "expression", call);
            } else if (!_.isNull(s.selector)) {
                w.sel(s.selector, call);
            } else {
                throw new Error("error in call");
            }
            call.close();
        } else if (is(s).type("Conditional")) {
            var cond = xml.element();
            root.push({"if": cond});
            s.branches.forEach(br => {
                w.branch(br, cond);
            });
            if (!_.isEmpty(s.otherwise)) {
                var els = xml.element();
                cond.push({"else": els});
                s.otherwise.forEach(s => {
                    w.stmt(s, els);
                });
                els.close();
            }
            cond.close();
        } else if (is(s).type("Cycle")) {
            var cond = xml.element();
            root.push({"while": cond});
            s.branches.forEach(br => {
                w.branch(br, cond);
            });
            cond.close();
        } else if (is(s).type("InvCycle")) {
            var cond = xml.element();
            root.push({"repeat": cond});
            w.branch(s.value, cond);
            cond.close();
        } else if (is(s).type("Choose")) {
            var attrs = {};
            attrs["type"] = s.typetest ? "typetest" : "exprtest";
            var ch = xml.element({_attr: attrs});
            root.push({"choose": ch});
            s.expression.forEach(e => w.expr(e, "expression", ch));
            s.branches.forEach(c => w.branch(c, ch));
            ch.close();
        } else {
            throw new Error("unexpected statement "+s.constructor.name);
        }
    };

    w.variable = function (o, root) {
        if (is(o).type("Variable")) {
            const attrs = {name: o.name, type: o.type.name};
            if (_.isObject(o.param)) {
                attrs["param"] = o.param.type;
                attrs["order"] = o.param.number;
            }
            if (!_.isEmpty(o.modifier)) {
                attrs["modifier"] = o.modifier;
            }
            if (!_.isUndefined(o.type.id)) {
                attrs["id"] = o.type.id;
            }
            root.push({"variable": {_attr: attrs}});
        } else if (is(o).type("Constant")) {
            const attrs = {name: o.name};
            if (!_.isEmpty(o.modifier)) {
                attrs["modifier"] = o.modifier;
            }
            var cs = xml.element({_attr: attrs});
            root.push({"constant": cs});
            w.expr2(o.expression, cs);
            cs.close();
        } else {
            throw new Error("unexpected object " + o.constructor.name + " " + JSON.stringify(o));
        }
    };

    w.build = function (stream) {
        var unit = xml.element({_attr: {name: mod.name, "xmlns:ot": "urn:kpmy:ot"}});
        var xs = xml({"unit": unit}, {stream: true, declaration: true});
        xs.pipe(stream);
        mod.imports.forEach(function (i) {
            const attrs = _.isEmpty(i.alias) ? {name: i.name} : {name: i.name, alias: i.alias};
            unit.push({"import": {_attr: attrs}});
        });
        for(var v in mod.objects){
            let o = mod.objects[v];
            w.variable(o, unit);
        }
        mod.blocks.forEach(function (b) {
            var attrs = {"name": b.name, "exported": b.exported, "infix": b.infix};
            var block = xml.element({_attr: attrs});
            unit.push({"block": block});
            for(var v in b.objects){
                let o = b.objects[v];
                w.variable(o, block);
            }
            b.pre.forEach(pre => w.expr(pre, "precondition", block));
            b.post.forEach(post => w.expr(post, "postcondition", block));

            var sequence = xml.element();
            block.push({"sequence": sequence});
            b.sequence.forEach(function (s) {
                w.stmt(s, sequence);
            });
            sequence.close();
            block.close();
        });
        if(!_.isEmpty(mod.start)){
            var start = xml.element();
            unit.push({"start": start});
            mod.start.forEach(function (s) {
                w.stmt(s, start);
            });
            start.close();
        }
        unit.close();
    }
}

module.exports.writer = function (mod, stream) {
    should.exist(mod);
    should.exist(stream);
    new Writer(mod).build(stream);
};

//запись в xml продолжает работать для сторонних интерпретаторов, а вот чтение пока выключаем и больше не поддерживаем, отнимает силы, а читать мы уже научились