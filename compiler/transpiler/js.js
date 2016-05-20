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

    b.variable = function (v) {
        st.write(`this.$${v.name} = new rts.Obj(new rts.Type("${v.type.name}"));`)
    };

    b.sel = function (s) {
        if(_.isEqual(s.module, mod.name)){
            st.write(`this.$${s.name}`);
        } else {
            throw new Error("foreign selector not supported");
        }

        if(!_.isEmpty(s.inside)){
            throw new Error("inside selector not supported");
        }
    };

    b.expr = function (e) {
        st.write("(");
        if(ast.is(e).type("ConstExpr")){
            st.write(`new rts.Value("${e.type.name}", ${e.value})`);
        } else {
            throw new Error("unknown expression " + e.constructor.name);
        }
        st.write(")");
    };

    b.stmt = function (s) {
        if(ast.is(s).type("Assign")){
            b.sel(s.selector);
            st.write(".value = ");
            b.expr(s.expression);
        } else {
            throw new Error("unknown statement " + s.constructor.name);
        }
        b.ln(";");
    };

    b.import = function (imp) {
        st.write(`this.Import${imp.name} = rts.load("${imp.name}");\n`);
    };

    b.build = function () {
        st.write(`function Module${mod.name} (rts){\n`);

        mod.imports.forEach(function (i) {
            b.import(i);
        });

        for(v in mod.objects) {
            var o = mod.objects[v];
            if(ast.is(o).type("Variable")){
                b.variable(o);
                b.ln();
            } else {
                throw new Error("unknown object " + o.constructor.name);
            }
        }
        st.write(`this.start = function(){\n`);

        st.write(`console.log('dynamic load ${mod.name}'); \n`);
        
        if(!_.isEmpty(mod.start)){
            mod.start.forEach(function(s){
                b.stmt(s);
                b.ln();
            });
        }

        b.ln("};");

        b.ln(`};`);

        st.write(`module.exports = function(rts){
            return new Module${mod.name} (rts)};`);
    };
}

module.exports = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Builder(mod, stream).build();
    }
};