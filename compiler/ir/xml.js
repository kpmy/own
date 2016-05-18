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
        root.push({"selector": {_attr: {
            "module": s.module,
            "name": s.name
        }}});
    };

    w.expr2 = function (e, root) {
        if(ast.is(e).type("ConstExpr")){
            var attrs = {type: e.type.name};
            root.push({"constant": [{_attr: attrs}, e.value.toString()]});
        } else {
            throw new Error("unexpected expression")
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
        if(ast.is(s).type("Assign")){
            var ass = xml.element();
            root.push({"assign": ass});
            w.expr(s.expression, "expression", ass);
            w.sel(s.selector, ass);
            ass.close();
        } else {
            throw new Error("unexpected statement")
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
            if(ast.is(o).type("Variable")){
                const attrs = {name: o.name, type: o.type.name};
                unit.push({"variable": {_attr: attrs}});
            } else {
                throw new Error("unexpected object " + o.constructor.name + " " + JSON.stringify(o));
            }
        }
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
                            } else if (ast.is(x).type("Variable")){
                                mod.objects[x.name] = x;
                            } else {
                                    throw new Error("unknown object " + x.constructor.name + " " + JSON.stringify(x));
                            }
                        });
                    } else {
                        throw Error("unexpected unit tag");
                    }
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
                    push(v);
                    break;
                default:
                    throw new Error("unknown tag "+n.name);
            }
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
                case "import":
                case "variable":
                    //do nothing
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