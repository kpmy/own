/* Created by kpmy on 13.05.2016 */
const should = require("should");
const xml = require("xml");
//const sax = require("sax");
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
        if(ast.is(e).type("ConstExpr")) {
            switch (e.type.name){
                case "STRING":
                case "INTEGER":
                case "CHAR":
                case "BOOLEAN":
                case "ANY":
                case "BLOCK":
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
                    w.tpl(e.value, type);
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

        } else if (ast.is(e).type("CallExpr")) {
            var attrs = {"module": e.module, "name": e.name};
            var call = xml.element({_attr: attrs});
            root.push({"call-expression": call});
            e.params.forEach(x => {
                w.param(x, call);
            });
            call.close();
        } else if (ast.is(e).type("SelectExpr")) {
            var sel = xml.element();
            root.push({"select-expression": sel});
            w.sel(e.selector, sel);
            sel.close();
        } else if (ast.is(e).type("DerefExpr")) {
            root.push({"deref-expression": {}})
        } else if (ast.is(e).type("DotExpr")) {
            root.push({"dot-expression": {}})
        } else if (ast.is(e).type("DyadicOp")) {
            var op = xml.element({_attr: {"op": e.op}});
            root.push({"dyadic-op": op});
            w.expr(e.left, "left", op);
            w.expr(e.right, "right", op);
            op.close();
        } else if (ast.is(e).type("MonadicOp")) {
            var op = xml.element({_attr: {"op": e.op}});
            root.push({"monadic-op": op});
            w.expr(e.expr, "expression", op);
            op.close();
        } else if (ast.is(e).type("InfixExpr")) {
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
        var br = xml.element();
        root.push({"branch": br});
        w.expr(b.condition, "condition", br);
        b.sequence.forEach(s => {
            w.stmt(s, br);
        });
        br.close();
    };

    w.stmt = function (s, root) {
        if(ast.is(s).type("Assign")) {
            var ass = xml.element();
            root.push({"assign": ass});
            w.expr(s.expression, "expression", ass);
            w.sel(s.selector, ass);
            ass.close();
        } else if(ast.is(s).type("Call")) {
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
        } else if (ast.is(s).type("Conditional")) {
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
        } else if (ast.is(s).type("Cycle")) {
            var cond = xml.element();
            root.push({"while": cond});
            s.branches.forEach(br => {
                w.branch(br, cond);
            });
            cond.close();
        } else if (ast.is(s).type("InvCycle")) {
            var cond = xml.element();
            root.push({"repeat": cond});
            w.branch(s.value, cond);
            cond.close();
        } else {
            throw new Error("unexpected statement "+s.constructor.name);
        }
    };

    w.variable = function (o, root) {
        if (ast.is(o).type("Variable")) {
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
        } else if (ast.is(o).type("Constant")) {
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
/*
function Reader(source) {
    this.read = function () {
        var xs = sax.parser(true);
        var mod = null;
        var stack = [];
        var stackTypes = [];

        function stackType() {
            return _.last(stackTypes);
        }

        function push(x) {
            should.ok(!_.isEmpty(stack));
            consume = stack[stack.length - 1];
            consume(x);
        }
        xs.onopentag = function (n) {
            switch (n.name){
                case "unit":
                    if(_.isEmpty(stack)){
                        mod = ast.mod();
                        mod.name = n.attributes["name"];
                        stack.push(function (x) {
                            if(ast.is(x).type("Import")) {
                                mod.imports.push(x);
                            } else if (ast.is(x).type("Variable") || ast.is(x).type("Constant")) {
                                mod.objects[x.name] = x;
                            } else if (ast.is(x).type("Block")){
                                mod.blocks.push(x);
                            } else {
                                    throw new Error("unknown object " + x.constructor.name + " " + JSON.stringify(x));
                            }
                        });
                    } else {
                        throw Error("unexpected unit tag");
                    }
                    break;
                case "block":
                    var block = ast.block();
                    block.name = n.attributes["name"];
                    block.exported = _.isEqual(n.attributes["exported"], "true");
                    push(block);
                    stack.push(function (x) {
                        if (ast.is(x).type("Variable")) {
                            block.objects[x.name] = x;
                        } else if (ast.isStatement(x)){
                            block.sequence.push(x);
                        } else {
                            throw new Error("unknown object " + x.constructor.name + " " + JSON.stringify(x));
                        }
                    });
                    break;
                case "import":
                    var imp = ast.imp();
                    imp.name = n.attributes["name"];
                    imp.alias = n.attributes.hasOwnProperty("alias") ? n.attributes["alias"] : "";
                    //console.log("need resolve", imp.name);
                    imp.def = ast.def();
                    push(imp);
                    break;
                case "variable":
                    var v = ast.variable();
                    v.name = n.attributes["name"];
                    var t = null;
                    if (!_.isEqual(n.attributes["type"], "USER")) {
                        t = types.find(n.attributes["type"]);
                    } else {
                        t = mod.thisType(n.attributes["id"]);
                    }
                    should.exist(t);
                    v.type = t;
                    if(n.attributes.hasOwnProperty("param")){
                        v.param = ast.formal();
                        v.param.type = n.attributes["param"];
                        v.param.number = parseInt(n.attributes["order"], 10);
                    }
                    if(n.attributes.hasOwnProperty("modifier")){
                        v.modifier = n.attributes["modifier"];
                    }
                    push(v);
                    break;
                case "constant":
                    var c = ast.constant();
                    c.name = n.attributes["name"];
                    if (n.attributes.hasOwnProperty("modifier")) {
                        v.modifier = n.attributes["modifier"];
                    }
                    push(c);
                    stack.push(function (x) {
                        should.ok(ast.isExpression(x));
                        c.expression = x;
                    });
                    break;
                case "start":
                    stack.push(function (x) {
                        should.ok(ast.isStatement(x));
                        mod.start.push(x);
                    });
                    break;
                case "sequence":
                    const oldPush = _.last(stack);
                    stack.push(function (x) {
                        should.ok(ast.isStatement(x));
                        oldPush(x);
                    });
                    break;
                case "assign":
                    var a = ast.stmt().assign();
                    push(a);
                    stack.push(function (x) {
                        if(ast.is(x).type("Selector")){
                            a.selector = x;
                        }else if (ast.isExpression(x)) {
                            a.expression = x;
                        } else {
                            throw new Error("unknown object of assign " + x.constructor.name + " " + JSON.stringify(x));
                        }
                    });
                    break;
                case "call":
                    var c = ast.stmt().call();
                    push(c);
                    stack.push(function (x) {
                        if(ast.is(x).type("CallExpr")) {
                            c.expression = x;
                        } else if (ast.is(x).type("Selector")){
                            c.selector = x;
                        } else {
                            throw new Error("unknown object of call " + x.constructor.name + " " + JSON.stringify(x));
                        }
                    });
                    break;
                case "if":
                    var c = ast.stmt().cond();
                    push(c);
                    stack.push(function (x) {
                        if (ast.is(x).type("ConditionalBranch")) {
                            c.branches.push(x)
                        } else if (ast.isStatement(x)) {
                            c.otherwise.push(x);
                        } else {
                            throw new Error(`unknown object for if ${x.constructor.name}`);
                        }
                    });
                    break;
                case "while":
                    var c = ast.stmt().cycle();
                    push(c);
                    stack.push(function (x) {
                        if (ast.is(x).type("ConditionalBranch")) {
                            c.branches.push(x)
                        } else {
                            throw new Error(`unknown object for while ${x.constructor.name}`);
                        }
                    });
                    break;
                case "repeat":
                    var c = ast.stmt().invCycle();
                    push(c);
                    stack.push(function (x) {
                        if (ast.is(x).type("ConditionalBranch")) {
                            c.value = x;
                        } else {
                            throw new Error(`unknown object for repeat ${x.constructor.name}`);
                        }
                    });
                    break;
                case "selector":
                    var s = ast.selector();
                    s.module = n.attributes["module"];
                    s.name = n.attributes["name"];
                    s.block = n.attributes.hasOwnProperty("block") ? n.attributes["block"] : null;
                    push(s);
                    stack.push(function(x){
                        if(ast.isExpression(x)){
                            s.inside.push(x);
                        } else {
                            throw new Error(`unknown object for selector ${x.constructor.name}`);
                        }
                    });
                    break;
                case "key":
                case "value":
                case "item":
                case "left":
                case "right":
                case "param":
                    stackTypes.push(n.name);
                    break;
                case "expression":
                case "condition":
                case "else":
                    //begin of any expression or sequence, do nothing
                    break;
                case "parameter":
                    var p = ast.expr().call().param();
                    push(p);
                    stack.push(x => {
                        should.ok(ast.isExpression(x));
                        p.expression = x;
                    });
                    break;
                case "constant-expression":
                    var t = types.find(n.attributes["type"]);
                    should.exist(t);
                    var e = ast.expr().constant(t);
                    var structured = false;
                    if (n.attributes.hasOwnProperty("structured")) {
                        structured = JSON.parse(n.attributes["structured"]);
                    }
                    push(e);
                    stack.push(function (x) {
                        switch (e.type.name){
                            case "INTEGER":
                            case "STRING":
                            case "BOOLEAN":
                            case "ANY":
                            case "CHAR":
                            case "BLOCK":
                            case "ATOM":
                                if (!structured) {
                                    e.setValue(x);
                                } else {
                                    should.ok(tpl.isLeaf(x));
                                    e.setValue(x.qid.cls);
                                    e.structure = x;
                                }
                                break;
                            case "TYPE":
                                should.ok(tpl.isLeaf(x));
                                e.setValue(x);
                                break;
                            case "LIST":
                            case "MAP":
                            case "SET":
                                if(_.isUndefined(e.value)){
                                    e.value = [];
                                }
                                switch (stackType()) {
                                    case "key":
                                        e.value.push([x, null]);
                                        break;
                                    case "value":
                                        _.last(e.value)[1] = x;
                                        break;
                                    case "item":
                                        e.value.push(x);
                                        break;
                                    default: throw new Error(`unknown stack type ${x.constructor.name}`);
                                }
                                break;
                            default:
                                throw new Error(`unknown constant value ${e.type.name}`);
                        }
                    });
                    break;
                case "call-expression":
                    var e = ast.expr().call(n.attributes["module"], n.attributes["name"]);
                    push(e);
                    stack.push(function (x) {
                        if (ast.is(x).type("Param")){
                            e.params.push(x);
                        } else {
                            throw new Error("unknown object for call-expression " + x.constructor.name + JSON.stringify(x));
                        }
                    });
                    break;
                case "select-expression":
                    var e = ast.expr().select();
                    push(e);
                    stack.push(function (x) {
                        if(ast.is(x).type("Selector")){
                            e.selector = x;
                        } else {
                            throw new Error("unknown object for select-expression " + x.constructor.name + JSON.stringify(x));
                        }
                    });
                    break;
                case "deref-expression":
                    var e = ast.expr().deref();
                    push(e);
                    break;
                case "dot-expression":
                    var e = ast.expr().dot();
                    push(e);
                    break;
                case "dyadic-op":
                    var op = ast.expr().dyadic(n.attributes["op"]);
                    push(op);
                    stack.push(function (x) {
                        should.ok(ast.isExpression(x));
                        switch (stackType()) {
                            case "left":
                                op.left = x;
                                break;
                            case "right":
                                op.right = x;
                                break;
                            default:
                                throw new Error(`unknown object for dyadic op ${JSON.stringify(x)}`);
                        }
                    });
                    break;
                case "monadic-op":
                    var op = ast.expr().monadic(n.attributes["op"]);
                    push(op);
                    stack.push(function (x) {
                        should.ok(ast.isExpression(x));
                        op.expr = x;
                    });
                    break;
                case "infix-expression":
                    var inf = ast.expr().infix();
                    inf.arity = parseInt(n.attributes["arity"], 10);
                    push(inf);
                    stack.push(function (x) {
                        if (!_.isEqual(stackType(), "param")) {
                            if (ast.is(x).type("CallExpr")) {
                                inf.expression = x;
                            } else if (ast.is(x).type("Selector")) {
                                inf.selector = x;
                            } else {
                                throw new Error(`wrong object for infix expr ${x.constructor.name}`);
                            }
                        } else {
                            should.ok(ast.isExpression(x));
                            inf.params.push(x);
                        }
                    });
                    break;
                case "ot:value":
                    var t = types.find(n.attributes["type"]);
                    should.exist(t);
                    var v = new tpl.Value(t);
                    push(v);
                    stack.push(function (x) {
                        switch (v.type.name) {
                            case "STRING":
                                v.value = x;
                                break;
                            default:
                                throw new Error(`unknown ot:value type ${v.type.name}`);
                        }
                    });
                    break;
                case "ot:object":
                    var o = new tpl.Leaf();
                    o.qid = new tpl.Qualident(n.attributes["tpl"], n.attributes["cls"], n.attributes["id"]);
                    o.clazz = new tpl.Clazz(o.qid.tpl, o.qid.cls);
                    if (n.attributes.hasOwnProperty("unique")) o.unique = JSON.parse(n.attributes["unique"]);
                    push(o);
                    stack.push(function (x) {
                        if (tpl.isLeaf(x)) {
                            x.up = o;
                            o.children.push(x);
                        } else if (tpl.isValue(x)) {
                            o.children.push(x);
                        } else {
                            throw new Error(`unknown ot:object child ${x.constructor.name}`);
                        }
                    });
                    break;
                case "branch":
                    var b = ast.stmt().cond().branch();
                    push(b);
                    stack.push(function (x) {
                        if (ast.isExpression(x)) {
                            b.condition = x;
                        } else if (ast.isStatement(x)) {
                            b.sequence.push(x);
                        } else {
                            throw new Error(`unknown object for branch ${x.constructor.name}`);
                        }
                    });
                    break;
                default:
                    throw new Error("unknown tag "+n.name);
            }
        };

        xs.ontext = function (t) {
            if(!_.isEmpty(stack))
                push(t);
        };

        xs.onclosetag = function (name) {
            switch (name) {
                case "unit":
                    var x = stack.pop();
                    if (_.isEmpty(stack)){
                        //end
                    } else {
                        throw new Error("unexpected unit close tag");
                    }
                    break;
                case "assign":
                case "start":
                case "constant-expression":
                case "call":
                case "sequence":
                case "block":
                case "select-expression":
                case "call-expression":
                case "parameter":
                case "selector":
                case "dyadic-op":
                case "monadic-op":
                case "infix-expression":
                case "constant":
                case "ot:value":
                case "ot:object":
                case "if":
                case "branch":
                case "while":
                case "repeat":
                    stack.pop();
                    break;
                case "expression":
                case "import":
                case "variable":
                case "deref-expression":
                case "dot-expression":
                case "else":
                case "condition":
                    //do nothing
                    break;
                case "key":
                case "value":
                case "item":
                case "left":
                case "right":
                case "param":
                    stackTypes.pop();
                    break;
                default:
                    throw new Error("unknown close tag "+name);
            }
        };

        xs.write(source).close();
        return mod;
    }
}
 */

module.exports.writer = function (mod, stream) {
    should.exist(mod);
    should.exist(stream);
    new Writer(mod).build(stream);
};
/*
module.exports.read = function (source) {
    should.exist(source);
    return new Reader(source).read();
};
 */

/*
 var ad = fs.openSync(root + "/" + name + ".ox", "r");
 var asts = fs.readFileSync(ad, "utf8");
 console.log(asts);
 var mod = rerequire("./ir/xml.js").read(asts);
 fs.close(ad);
 */

//запись в xml продолжает работать для сторонних интерпретаторов, а вот чтение пока выключаем и больше не поддерживаем, отнимает силы, а читать мы уже научились