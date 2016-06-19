/**
    * Created by kpmy on 13.05.2016.
    */
const should = require("should");
const _ = require('underscore');

const ast = rerequire("../ir/ast.js");
const tpl = rerequire("../ir/tpl.js").struct();
const types = rerequire("../ir/types.js")();

function Builder(mod) {
    const b = this;
    b.buffer = "";

    b.count = 0;
    b.nextInt = () => {
        b.count++;
        return b.count;
    };

    b.ln = function (x) {
        if (x) b.buffer = b.buffer.concat(x);

        b.buffer = b.buffer.concat("\n");
    };

    b.write = function (x) {
        b.buffer = b.buffer.concat(x);
    };

    b.val = function (v) {
        var x = null;
        switch (v.type.name) {
            case "STRING":
                x = "`" + v.value + "`";
                break;
            default:
                throw new Error(`unknown value type ${v.type.name}`);
        }
        should.exist(x);
        b.write(`function(){`);
        b.write(`var v = new tpl.Value(types.find("${v.type.name}"), ${x});\n`);
        b.write(`return v}()`)
    };

    b.tpl = function (t) {
        b.write(`function(){`);
        b.write(`var t = new tpl.Leaf();\n`);
        var tp = _.isUndefined(t.qid.tpl) ? undefined : `"` + t.qid.tpl + `"`;
        var cl = _.isUndefined(t.qid.cls) ? undefined : `"` + t.qid.cls + `"`;
        var id = _.isUndefined(t.qid.id) ? undefined : `"` + t.qid.id + `"`;

        b.write(`t.qid = new tpl.Qualident(${tp}, ${cl}, ${id});\n`);
        b.write(`t.clazz = new tpl.Clazz(${tp}, ${cl});\n`);
        b.write(`t.unique = ${t.unique};\n`);
        t.children.forEach((x) => {
            b.write(`t.push(`);
            if (tpl.isLeaf(x)) {
                b.tpl(x)
            } else {
                b.val(x)
            }
            b.write(");\n")
        });
        b.write(`return t}()`);
    };

    b.variable = function (v, scope) {
        var sc = null;
        if(ast.is(scope).type("Module")) {
            sc = "mod.";
        }else if (ast.is(scope).type("Block")){
            sc = "var ";
        } else {
            throw new Error(`unknown scope ${scope.constructor.name}`);
        }
        should.exist(sc);
        if (_.isEqual(v.type.name, "USER")) {
            b.write(`${sc}$${v.name} = new rts.Obj(`);
            var ts = ast.selector();
            ts.module = mod.name;
            ts.name = v.type.id;
            b.write(`new rts.Type("USER", "${ts.name}", `);
            b.sel(ts);
            b.write(".value()");
            b.write(`));`);
        } else {
            b.write(`${sc}$${v.name} = new rts.Obj(new rts.Type("${v.type.name}"));`)
        }
    };

    b.consts = function (c, scope) {
        var sc = null;
        if (ast.is(scope).type("Module")) {
            sc = "mod.";
        } else if (ast.is(scope).type("Block")) {
            sc = "var ";
        } else {
            throw new Error(`unknown scope ${scope.constructor.name}`);
        }
        should.exist(sc);
        b.write(`${sc}$${c.name} = new rts.Const(`);
        b.expr(c.expression);
        b.write(`);`);
    };

    b.sel = function (s) {
        if(_.isEqual(s.module, mod.name)){
            var sc = "mod.";
            if(!_.isNull(s.block)) {
                sc = "";
            }
            b.write(`${sc}$${s.name}`);
        } else {
            should.ok(_.isNull(s.block)); //foreign blocks should be inaccessible
            b.write(`mod.Import${s.module}.$${s.name}`);
        }

        function select(el) {
            should.ok(el.length > 0);
            b.write(".select(");
            Array.from(el)
                .forEach((o, i, l) => {
                    if (i > 0) b.write(",");
                    b.expr(o);
                });
            b.write(")");
        }
        function deref() {
            b.write(".deref()");
        }
        function flush(eb) {
            if (eb.length > 0)
                select(eb);
            eb.length = 0;
        }

        function cast(e) {
            b.write(".cast(");
            b.expr(e);
            b.write(")");
        }
        if(!_.isEmpty(s.inside)){
            var eb = [];
            Array.from(s.inside)
                .forEach(e => {
                    if(ast.is(e).type("DerefExpr")) {
                        flush(eb);
                        deref();
                    } else if (ast.is(e).type("DotExpr")) {
                        flush(eb);
                        if (!_.isNull(eb.value)) {
                            select([ast.expr().constant(types.ATOM, e.value)]);
                        }
                    } else if (ast.is(e).type("CastExpr")) {
                        flush(eb);
                        cast(e.expression);
                    } else {
                        eb.push(e);
                    }
                });
            flush(eb);
        }
    };

    b.params = function (params, block) {
        //ordered param objects list
        var fp = [];
        if (_.isObject(block)){
            fp = Array.from(Object.keys(block.objects))
                .filter(k => _.isObject(block.objects[k].param))
                .map(k => block.objects[k])
                .sort((p0, p1) => p0.param.number - p1.param.number);
        }

        params.forEach((p, i, $) => {
            if(i > 0) b.ln(",");
            var valueParam = true;
            if(i < fp.length && _.isEqual(fp[i].param.type, "reference")){
                if (typeof p == "string") { //temporary
                    b.write(p);
                    valueParam = false;
                } else if (ast.is(p.expression).type("SelectExpr")) {
                    if(!_.isEqual(mod.name, p.expression.selector.module)){
                        var imp = mod.thisImport(p.expression.selector.module);
                        var o = imp.def.objects[p.expression.selector.name];
                        should.ok(_.isEqual(o.modifier, "rw"));
                    }
                    b.sel(p.expression.selector);
                    valueParam = false;
                }
            } else if (_.isUndefined(block)){
                if (typeof p == "string") { //temporary
                    b.write(p);
                } else if (ast.is(p).type("SelectExpr")) {
                    b.sel(p.selector);
                } else {
                    b.expr(p);
                }
                valueParam = false;
            }

            if (valueParam) {
                b.expr(p.expression);
            }
        });
    };

    b.expr = function (e) {
        b.write("(");
        if(ast.is(e).type("ConstExpr")) {
            if (_.isEqual(e.type.name, "MAP")) {
                b.write(`new rts.Value("${e.type.name}", [`);
                Array.from(e.value)
                    .forEach((o, i, a) => {
                        if (i > 0) b.write(",\n");
                        b.write("[");
                        b.expr(o[0]);
                        b.write(",\t");
                        b.expr(o[1]);
                        b.write("]")
                    });
                b.write(`])`)
            } else if (_.isEqual(e.type.name, "LIST") || _.isEqual(e.type.name, "SET")) {
                b.write(`new rts.Value("${e.type.name}", [`);
                Array.from(e.value)
                    .forEach((o, i, a) => {
                        if (i > 0) b.write(",\n");
                        b.expr(o);
                    });
                b.write(`])`)
            } else if (_.isEqual(e.type.name, "BLOCK")) {
                var mb = e.value.split(".");
                should.exist(mb);
                var bs = ast.selector();
                bs.module = mb[0];
                bs.name = mb[1];
                b.write(`new rts.Value("${e.type.name}", `);
                b.sel(bs);
                b.write(`)`)
            } else if (_.isEqual(e.type.name, "ATOM")) {
                if (_.isObject(e.structure)) {
                    b.write(`new rts.Value("${e.type.name}", `);
                    b.tpl(e.structure);
                    b.write(`)`);
                } else {
                    b.write(`new rts.Value("${e.type.name}", "${e.value}")`);
                }
            } else if (_.isEqual(e.type.name, "TYPE")) {
                b.write(`new rts.Value("${e.type.name}", `);
                if (ast.is(e.value).type("Type")) {
                    b.write(`types.find("${e.value.name}")`);
                } else {
                    b.tpl(e.value);
                }
                b.write(`)`);
            } else {
                var v = e.value;
                var enc = null;
                if (_.isEqual(e.type.name, "ANY") && _.isEqual(v, "NONE")) {
                    v = "global.NONE";
                } else if (_.isEqual(e.type.name, "POINTER") && _.isEqual(v, "NIL")) {
                    v = "{adr: 0}";
                } else if (_.isEqual(e.type.name, "STRING")) {
                    v = "`" + new Buffer(v).toString("base64") + "`";
                    enc = "base64";
                } else if (_.isEqual(e.type.name, "CHAR")) {
                    v = v.charCodeAt(0);
                    enc = "charCode"
                }
                if (!_.isNull(enc)) {
                    b.write(`new rts.Value("${e.type.name}", ${v}, "${enc}")`);
                } else {
                    b.write(`new rts.Value("${e.type.name}", ${v})`);
                }
            }
        } else if (ast.is(e).type("WildcardExpr")) {
            b.write("true");
        } else if (ast.is(e).type("CallExpr")) {
            var m = "mod";
            var block = null;
            if (!_.isEqual(mod.name, e.module)) {
                m = `mod.Import${e.module}`;
                var imp = mod.thisImport(e.module);
                block = imp.thisBlock(e.name);
            } else {
                block = mod.thisBlock(e.name);
            }
            should.exist(block); //ast.Block or object from def
            b.write(`${m}.$${e.name}(`);
            b.params(e.params, block);
            b.write(`)`);
        } else if (ast.is(e).type("SelectExpr")) {
            b.write("rts.copyOf(");
            b.sel(e.selector);
            b.write(".value())");
        } else if (ast.is(e).type("DyadicOp")) {
            b.write("rts.math.dop(");
            b.write("function(){return ");
            b.expr(e.left);
            b.write("}, ");
            b.write(`"${e.op}", `);
            b.write("function(){return ");
            b.expr(e.right);
            b.write("}");
            b.write(")");
        } else if (ast.is(e).type("MonadicOp")) {
            b.write(`rts.math.mop("${e.op}", `);
            b.write("function(){return ");
            b.expr(e.expr);
            b.write("}");
            b.write(")")
        } else if (ast.is(e).type("InfixExpr")) {
            b.write(`function(){ `);
            if (!_.isNull(e.expression)) {
                var m = "mod";
                var block = null;
                if (!_.isEqual(mod.name, e.expression.module)) {
                    m = `mod.Import${e.expression.module}`;
                    var imp = mod.thisImport(e.expression.module);
                    block = imp.thisBlock(e.expression.name);
                } else {
                    block = mod.thisBlock(e.expression.name);
                }
                should.exist(block); //ast.Block or object from def
                var fp = [];
                if (_.isObject(block)) {
                    fp = Array.from(Object.keys(block.objects))
                        .filter(k => _.isObject(block.objects[k].param))
                        .map(k => block.objects[k])
                        .sort((p0, p1) => p0.param.number - p1.param.number);
                }
                var tmp = "tmp" + b.nextInt();
                var tmpType = null;
                var i = 0;
                var tp = [];
                fp.forEach(p => {
                    if (_.isNull(tmpType) && _.isEqual(p.param.type, "reference")) {
                        tmpType = p.type.name;
                        tp.push(tmp);
                    } else {
                        tp.push(e.expression.param(e.params[i]));
                        i++;
                    }
                });
                e.expression.params = tp;
                should.exist(tmpType);
                b.write(`var ${tmp} = new rts.Obj(new rts.Type("${tmpType}"));\n`);
                b.expr(e.expression);
                b.ln(";");
                b.write(`return ${tmp}.value();`);
            } else {
                var inside = e.params.slice();
                e.selector.inside = [];
                var tmp = "tmp" + b.nextInt();
                var tmpType = "ANY";
                b.write(`var ${tmp} = new rts.Obj(new rts.Type("${tmpType}"));\n`);
                var fp = [];
                if (inside.length < 2) {
                    fp.push(tmp, inside[0]);
                } else {
                    fp.push(inside[0], tmp);
                    for (var i = 1; i < inside.length; i++) {
                        fp.push(inside[i]);
                    }
                }
                b.sel(e.selector);
                b.write(".call(");
                b.params(fp);
                b.write(");\n");
                b.write(`return ${tmp}.deref().value();`);
            }
            b.write("}()");
        } else {
            throw new Error("unknown expression " + e.constructor.name);
        }
        b.write(")");
    };

    b.stmt = function (s) {
        if(ast.is(s).type("Assign")) {
            b.sel(s.selector);
            b.write(".value(");
            b.expr(s.expression);
            b.write(")");
        } else if (ast.is(s).type("Call")) {
            if (!_.isNull(s.expression)) {
                b.expr(s.expression);
            } else if (!_.isNull(s.selector)) {
                var inside = s.selector.inside.slice();
                s.selector.inside = [];
                b.sel(s.selector);
                b.write(".call(");
                b.params(inside);
                b.write(")");
            } else {
                throw new Error("wrong call");
            }
        } else if (ast.is(s).type("Conditional")) {
            s.branches.forEach((br, i, $) => {
                if (i > 0) b.write(" else ");
                b.write(`if(rts.getNative("boolean", `);
                b.expr(br.condition);
                b.ln(`)){`);
                br.sequence.forEach(s => {
                    b.stmt(s);
                    b.ln(";");
                });
                b.write(`}`);
            });
            if (!_.isEmpty(s.otherwise)) {
                b.ln(`else {`);
                s.otherwise.forEach(s => {
                    b.stmt(s);
                    b.ln(`;`);
                });
                b.write(`}`)
            }
        } else if (ast.is(s).type("Cycle")) {
            var cond = "cond" + b.nextInt();
            b.ln(`for (var ${cond} = true; ${cond}; ){`);
            s.branches.forEach((br, i, $) => {
                if (i > 0) b.write(" else ");
                b.write(`if(rts.getNative("boolean", `);
                b.expr(br.condition);
                b.ln(`)){`);
                br.sequence.forEach(s => {
                    b.stmt(s);
                    b.ln(";");
                });
                b.write(`}`);
            });
            b.write(`else { `);
            b.write(`${cond} = false; }`);
            b.write(`}`);
        } else if (ast.is(s).type("InvCycle")) {
            var cond = "cond" + b.nextInt();
            b.ln(`for (var ${cond} = false; !${cond}; ){`);
            s.value.sequence.forEach(s => {
                b.stmt(s);
                b.ln(";");
            });
            b.write(`${cond} = rts.getNative("boolean", `);
            b.expr(s.value.condition);
            b.write(`)}`);
        } else if (ast.is(s).type("Choose")) {
            var cond = null;
            if (s.typetest || s.expression.length == 1) {
                cond = "cond" + b.nextInt();
                b.write(`var ${cond} = new rts.Value("ANY", `);
                b.expr(s.expression[0]);
                b.ln(")");
            } else if (s.expression.length > 1) {
                cond = [];
                var base = "cond" + b.nextInt();
                s.expression.forEach((e, i, $) => {
                    cond.push(base + "_" + i);
                    b.write(`var ${cond[i]} = new rts.Value("ANY", `);
                    b.expr(e);
                    b.ln(")");
                });
            }
            s.branches.forEach((br, i, $) => {
                if (i > 0) b.write(" else ");
                b.write("if(");
                br.condition.forEach((c, i, $) => {
                    if (s.typetest) {
                        b.write(`${cond}.isTypeEqual(`);
                    } else if (s.expression.length == 1) {
                        if (i > 0) b.write(" || ");
                        b.write(`${cond}.isValueEqual(`);
                    } else if (s.expression.length > 1) {
                        if (i > 0) b.write(" && ");
                        if (!ast.is(c).type("WildcardExpr")) {
                            b.write(`${cond[i]}.isValueEqual(`);
                        } else {
                            b.write("(")
                        }
                    } else {
                        b.write(`rts.getNative("boolean", `);
                    }
                    b.expr(c);
                    b.write(")");
                });
                b.write("){");
                br.sequence.forEach(s => {
                    b.stmt(s);
                    b.ln(";");
                });
                b.write(`}`);
            });

            if (!_.isEmpty(s.otherwise)) {
                b.ln(`else {`);
                s.otherwise.forEach(s => {
                    b.stmt(s);
                    b.ln(`;`);
                });
                b.write(`}`)
            }
        } else {
            throw new Error("unknown statement " + s.constructor.name);
        }
    };

    b.block = function (block) {
        b.write(`mod.$${block.name} = function(){\n`);
        //b.write(`console.log("enter ${mod.name}.${block.name}");\n`);
        //b.write(`console.dir(arguments, {depth: null});\n`);
        var par = [];
        for(v in block.objects) {
            var o = block.objects[v];
            if(ast.is(o).type("Variable")){
                b.variable(o, block);
                if(_.isObject(o.param)){
                    par.push(o);
                }
                b.ln();
            } else {
                throw new Error("unknown object " + o.constructor.name);
            }
        }
        Array.from(par)
            .sort((p0, p1) => p0.param.number - p1.param.number)
            .forEach((o, i, $) => {
            if(_.isEqual(o.param.type, "reference")){
                b.write(`if(arguments[${i}] !== undefined){\n`);
                b.write(`if(!rts.isValue(arguments[${i}])){\n`);
                b.write(`$${o.name} = arguments[${i}];\n`); //reference param
                b.write(`} else {\n`);
                b.write(`$${o.name}.value(arguments[${i}]);\n`);
                b.ln("}"); b.ln("}");
            } else {
                b.write(`$${o.name}.value(arguments[${i}]);`);
            }
            b.ln();
        });

        block.pre.forEach((pre, i, $) => {
            b.write(`if(!rts.getNative("boolean", `);
            b.expr(pre);
            b.write(`)) throw new Error("precondition ${i} violated");`);
            b.ln();
        });

        block.sequence.forEach(function(s){
            b.stmt(s);
            b.ln(";");
        });

        block.post.forEach((post, i, $) => {
            b.write(`if(!rts.getNative("boolean", `);
            b.expr(post);
            b.write(`)) throw new Error("postcondition ${i} violated");`);
            b.ln();
        });

        //b.write(`console.log("leave ${mod.name}.${block.name}");\n`);
        b.write(`}`);
    };

    b.import = function (imp) {
        b.write(`mod.Import${imp.name} = rts.load("${imp.name}");\n`);
        if (!_.isEmpty(imp.alias)) {
            b.write(`mod.Import${imp.alias} = mod.Import${imp.name};\n`);
        }
    };

    b.build = function () {
        b.write(`function Unit${mod.name} (rts){\n`);
        b.write(`const types = rts.types;\n`);
        b.write(`const tpl = rts.tpl;\n`);
        b.write(`const mod = this;\n`);
        b.ln();
        mod.imports.forEach(function (i) {
            b.import(i);
        });


        for(v in mod.objects) {
            var o = mod.objects[v];
            if (ast.is(o).type("Variable")) {
                b.variable(o, mod);
                b.ln();
            } else if (ast.is(o).type("Constant")) {
                b.consts(o, mod);
                b.ln();
            } else {
                throw new Error("unknown object " + o.constructor.name);
            }
        }

        mod.blocks.forEach(function (block) {
            b.ln();
            b.block(block);
            b.ln(`;`);
        });

        b.write(`mod.start = function(){\n`);

        //b.write(`console.log('dynamic load ${mod.name}'); \n`);
        
        if(!_.isEmpty(mod.start)){
            mod.start.forEach(function(s){
                b.stmt(s);
                b.ln(";");
            });
        }

        b.ln("};");

        b.ln(`};`);

        b.write(`module.exports = function(rts){return new Unit${mod.name} (rts)};`);
        return b.buffer;
    };
}

module.exports = function (mod, resolve) {
    should.exist(mod);
    should.exist(resolve);
    var std = ast.imp();
    std.name = "$std";
    std.alias = "";
    mod.imports.push(std);
    mod.imports.forEach(i => {
        i.def = resolve(i.name);
    });
    return new Builder(mod).build();
};