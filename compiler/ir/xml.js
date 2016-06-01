/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
const xml = require("xml");
const sax = require("sax");
const _ = require('underscore');

const ast = rerequire("./ast.js");
const types = rerequire("./types.js")();

function Writer(mod, stream) {
    const w = this;

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
                case "MAP":
                    var attrs = {"type": e.type.name};
                    var val = xml.element({_attr: attrs});
                    root.push({"constant-expression": val});
                    w.map(e.value, val);
                    val.close();
                    break;
                case "LIST":
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
        } else if (ast.is(e).type("SelectExpr")){
            var sel = xml.element();
            root.push({"select-expression": sel});
            w.sel(e.selector, sel);
            sel.close();
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
            if(!_.isNull(s.expression)) {
                w.expr(s.expression, "expression", call);
            } else if (!_.isNull(s.selector)){
                w.sel(s.selector, call);
            } else {
                throw new Error("error in call");
            }
            call.close();
        } else {
            throw new Error("unexpected statement "+s.constructor.name);
        }
    };

    w.variable = function (o, root) {
        if(ast.is(o).type("Variable")){
            const attrs = {name: o.name, type: o.type.name};
            if(_.isObject(o.param)){
                attrs["param"] = o.param.type;
                attrs["order"] = o.param.number;
            }
            root.push({"variable": {_attr: attrs}});
        } else {
            throw new Error("unexpected object " + o.constructor.name + " " + JSON.stringify(o));
        }
    };

    w.build = function() {
        stream.write('<?xml version="1.0" encoding="UTF-8"?>\n'); //header :(
        var unit = xml.element({_attr: {name: mod.name}});
        var xs = xml({"unit": unit}, {stream: true});
        xs.on("data", function (chunk) {
            stream.write(chunk);
        });
        xs.once("end", function () {
            stream.end();
        });
        mod.imports.forEach(function (i) {
            const attrs = _.isEmpty(i.alias) ? {name: i.name} : {name: i.name, alias: i.alias};
            unit.push({"import": {_attr: attrs}});
        });
        for(var v in mod.objects){
            let o = mod.objects[v];
            w.variable(o, unit);
        }
        mod.blocks.forEach(function (b) {
            var attrs = {"name": b.name};
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

function Reader(ret, stream) {
    this.read = function () {
        var xs = sax.createStream(true);
        var mod = null;
        var stack = [];
        var stackType = "";
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
                            } else if (ast.is(x).type("Variable")) {
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
                    console.log("need resolve", imp.name);
                    imp.def = ast.def();
                    push(imp);
                    break;
                case "variable":
                    var v = ast.variable();
                    v.name = n.attributes["name"];
                    var t = types.find(n.attributes["type"]);
                    should.exist(t);
                    v.type = t;
                    if(n.attributes.hasOwnProperty("param")){
                        v.param = ast.formal();
                        v.param.type = n.attributes["param"];
                        v.param.number = parseInt(n.attributes["order"], 10);
                    }
                    push(v);
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
                        }else if (ast.is(x).type("ConstExpr")) {
                            a.expression = x;
                        }else if (ast.is(x).type("SelectExpr")){
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
                    stackType = n.name;
                    break;
                case "expression":
                    //begin of any expression, do nothing
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
                    push(e);
                    stack.push(function (x) {
                        switch (e.type.name){
                            case "INTEGER":
                            case "STRING":
                            case "BOOLEAN":
                            case "ANY":
                            case "CHAR":
                            case "BLOCK":
                                e.setValue(x);
                                break;
                            case "LIST":
                            case "MAP":
                                if(_.isUndefined(e.value)){
                                    e.value = [];
                                }
                                switch (stackType){
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
                                throw new Error(`unknown constant value ${x}`);
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
                        ret(mod);
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
                    stack.pop();
                    break;
                case "expression":
                case "import":
                case "variable":
                    //do nothing
                    break;
                case "key":
                case "value":
                case "item":
                    stackType = "";
                    break;
                default:
                    throw new Error("unknown close tag "+name);
            }
        };
        
        stream.pipe(xs);
    }
}

module.exports.writer = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Writer(mod, stream).build();
    }
};

module.exports.reader = function (ret) {
    should.exist(ret);
    return function (stream) {
        should.exist(stream);
        new Reader(ret, stream).read();
    };
};