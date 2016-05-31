/**
    * Created by kpmy on 13.05.2016.
    */
const should = require("should");
const _ = require('underscore');
const Promise = require("bluebird");

const ast = rerequire("../ir/ast.js");

function Builder(mod, st) {
    const b = this;

    b.ln = function (x) {
        if(x) st.write(x);

        st.write("\n");
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
        st.write(`${sc}$${v.name} = new rts.Obj(new rts.Type("${v.type.name}"));`)
    };

    b.sel = function (s) {
        if(_.isEqual(s.module, mod.name)){
            var sc = "mod.";
            if(!_.isNull(s.block)) {
                sc = "";
            }
            st.write(`${sc}$${s.name}`);
        } else {
            should.ok(_.isNull(s.block)); //foreign blocks should be inaccessible
            st.write(`mod.Import${s.module}.$${s.name}`);
        }

        if(!_.isEmpty(s.inside)){
            should.ok(s.inside.length <= 1);
            st.write(".select(");
            Array.from(s.inside)
                .forEach((o, i, l) => {
                    if (i>0) st.write(",");
                    b.expr(o);
                });
            st.write(")");
        }
    };

    b.expr = function (e) {
        st.write("(");
        if(ast.is(e).type("ConstExpr")) {
            if (_.isEqual(e.type.name, "MAP")) {
                st.write(`new rts.Value("${e.type.name}", [`);
                Array.from(e.value)
                    .forEach((o, i, a) => {
                        if(i > 0) st.write(",");
                        st.write("[");
                        b.expr(o[0]);
                        st.write(",");
                        b.expr(o[1]);
                        st.write("]")
                    });
                st.write(`], "utf8")`)
            } else if (_.isEqual(e.type.name, "LIST")){
                st.write(`new rts.Value("${e.type.name}", [`);
                Array.from(e.value)
                    .forEach((o, i, a) => {
                        if(i > 0) st.write(",");
                        b.expr(o);
                    });
                st.write(`], "utf8")`)
            } else {
                var v = e.value;
                var enc = "utf8";
                if (_.isEqual(e.type.name, "ANY") && _.isEqual(v, "NONE")) {
                    v = "global.NONE";
                } else if (_.isEqual(e.type.name, "STRING")) {
                    v = "`" + new Buffer(v).toString("base64") + "`";
                    enc = "base64";
                } else if (_.isEqual(e.type.name, "CHAR")) {
                    v = v.charCodeAt(0);
                    enc = "charCode"
                }
                st.write(`new rts.Value("${e.type.name}", ${v}, "${enc}")`);
            }
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

            //ordered param objects list
            var fp = Array.from(Object.keys(block.objects))
                .filter(k => _.isObject(block.objects[k].param))
                .map(k => block.objects[k])
                .sort((p0, p1) => p0.param.number - p1.param.number);
            
            st.write(`${m}.$${e.name}(`);
            e.params.forEach((p, i, $) => {
                if(i > 0) b.ln(",");
                var valueParam = true;
                if(i < fp.length && _.isEqual(fp[i].param.type, "reference")){
                    if (ast.is(p.expression).type("SelectExpr")){
                        b.sel(p.expression.selector);
                        valueParam = false;
                    }
                }
                if (valueParam) {
                    b.expr(p.expression);
                }
            });
            st.write(`)`);
        } else if (ast.is(e).type("SelectExpr")){
            st.write("rts.copyOf(");
            b.sel(e.selector);
            st.write(".value())");
        } else {
            throw new Error("unknown expression " + e.constructor.name);
        }
        st.write(")");
    };

    b.stmt = function (s) {
        if(ast.is(s).type("Assign")) {
            b.sel(s.selector);
            st.write(".value(");
            b.expr(s.expression);
            st.write(")");
        } else if(ast.is(s).type("Call")){
            b.expr(s.expression);
        } else {
            throw new Error("unknown statement " + s.constructor.name);
        }
    };

    b.block = function (block) {
        st.write(`mod.$${block.name} = function(){\n`);
        st.write(`console.log("enter ${mod.name}.${block.name}");\n`);
        st.write(`console.dir(arguments, {depth: null});\n`);
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
        par.forEach((o, i, $) => {
            if(_.isEqual(o.param.type, "reference")){
                st.write(`if(!rts.isValue(arguments[${i}])){\n`);
                st.write(`$${o.name} = arguments[${i}];\n`); //reference param
                st.write(`} else {\n`);
                st.write(`$${o.name}.value(arguments[${i}]);`);
                b.ln("}");
            } else {
                st.write(`$${o.name}.value(arguments[${i}]);`);
            }
            b.ln();
        });
        block.sequence.forEach(function(s){
            b.stmt(s);
            b.ln(";");
        });
        st.write(`console.log("leave ${mod.name}.${block.name}");\n`);
        st.write(`}`);
    };

    b.import = function (imp) {
        st.write(`mod.Import${imp.name} = rts.load("${imp.name}");\n`);
    };

    b.build = function () {
        st.write(`function Unit${mod.name} (rts){\n`);
        st.write(`const mod = this;`);
        b.ln();
        mod.imports.forEach(function (i) {
            b.import(i);
        });


        for(v in mod.objects) {
            var o = mod.objects[v];
            if(ast.is(o).type("Variable")){
                b.variable(o, mod);
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

        st.write(`mod.start = function(){\n`);

        st.write(`console.log('dynamic load ${mod.name}'); \n`);
        
        if(!_.isEmpty(mod.start)){
            mod.start.forEach(function(s){
                b.stmt(s);
                b.ln(";");
            });
        }

        b.ln("};");

        b.ln(`};`);

        st.write(`module.exports = function(rts){return new Unit${mod.name} (rts)};`);
    };
}

module.exports = function (mod, resolve) {
    should.exist(mod);
    should.exist(resolve);
    return function (stream) {
        should.exist(stream);
        var pl = [];
        mod.imports.forEach(i => {
            pl.push(resolve(i.name));
        });
        Promise.all(pl).then(d => {
            mod.imports.forEach(i => {
                i.def = d.find(ii => _.isEqual(ii.name, i.name));
            });
            new Builder(mod, stream).build();
        });
    }
};