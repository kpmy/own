/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
const _ = require('underscore');

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
            sc = "var "
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
            throw new Error("inside selector not supported");
        }
    };

    b.expr = function (e) {
        st.write("(");
        if(ast.is(e).type("ConstExpr")) {
            var v = e.value;
            if(_.isEqual(e.type.name, "ANY") && _.isEqual(v, "NONE")){
                v = "global.NONE";
            }
            st.write(`new rts.Value("${e.type.name}", ${v})`);
        } else if (ast.is(e).type("CallExpr")) {
            var m = "mod";
            if (!_.isEqual(mod.name, e.module))
                m = `mod.Import${e.module}`;
            st.write(`${m}.$${e.name}()`);
        } else if (ast.is(e).type("SelectExpr")){
            st.write("rts.copyOf(");
            b.sel(e.selector);
            st.write(".value)");
        } else {
            throw new Error("unknown expression " + e.constructor.name);
        }
        st.write(")");
    };

    b.stmt = function (s) {
        if(ast.is(s).type("Assign")) {
            b.sel(s.selector);
            st.write(".value = ");
            b.expr(s.expression);
        } else if(ast.is(s).type("Call")){
            b.expr(s.expression);
        } else {
            throw new Error("unknown statement " + s.constructor.name);
        }
    };

    b.block = function (block) {
        st.write(`mod.$${block.name} = function(){\n`);

        for(v in block.objects) {
            var o = block.objects[v];
            if(ast.is(o).type("Variable")){
                b.variable(o, block);
                b.ln();
            } else {
                throw new Error("unknown object " + o.constructor.name);
            }
        }

        block.sequence.forEach(function(s){
            b.stmt(s);
            b.ln(";");
        });

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

module.exports = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Builder(mod, stream).build();
    }
};