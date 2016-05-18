/**
 * Created by petry_000 on 12.05.2016.
 */
const should = require("should");
const _ = require("underscore");
const Promise = require("bluebird");

const ast = rerequire("./ir/ast.js");
const types = rerequire("./ir/types.js")();

function Parser(sc, resolver) {
    const p = this; //use with care within closures...

    p["pr"] = rerequire("./help.js")(sc);
    p["sc"] = sc;
    p["tgt"] = null;
    p["resolvers"] = [];


    function Expression() {
        const e = this;

        e.value = null;

        e.factor = function () {
            if(p.pr.is(sc.NUM)){
                let n = p.pr.num();
                e.value = ast.expr().constant(n.type, n.value);
                p.pr.next();
            } else {
                p.sc.mark("invalid expression ", p.pr.sym.code);
            }
        };

        e.cpx = function () {
            e.factor();
        };

        e.power = function () {
            e.cpx();
        };

        e.product = function () {
            e.power();
        };

        e.quantum = function () {
            e.product();
        };

        e.quantum();
    }
    p.resolve = function (name) {
        var promise = resolver(name);
        p.resolvers.push(promise);
        return promise;
    };

    p.imp = function (b) {
        var cache = {};
        while(p.pr.wait(sc.IMPORT, sc.SEPARATOR, sc.DELIMITER)){
            p.pr.next();
            for(var stop = false; !stop;){
                if (p.pr.wait(sc.IDENT, sc.SEPARATOR, sc.DELIMITER)){
                    const name = p.pr.ident();
                    var alias = "";
                    p.pr.next();
                    if (p.pr.wait(sc.ASSIGN, sc.DELIMITER)){
                        p.pr.next();
                        p.pr.expect(sc.IDENT, sc.DELIMITER);
                        alias = p.pr.ident();
                        p.pr.next();
                    }
                    var imp = ast.imp();
                    if(!b.hasImport(alias)){
                        if (_.isEqual(name, p.tgt.mod.name)){
                            p.sc.mark("module cannot import itself");
                        }
                        imp.name = name;
                        imp.alias = alias;
                        if(!cache.hasOwnProperty(name)){
                            p.resolve(name).then(function (def) {
                                cache[name].def = def;
                                const noCycle = function (i) {
                                    i.imports.forEach(function (ii) {
                                        if(_.isEqual(ii.name, p.tgt.mod.name)){
                                            p.sc.mark("cyclic import from ", i.name);
                                        } else {
                                            noCycle(ii);
                                        }
                                    });
                                };
                                noCycle(cache[name]);
                            });
                            cache[name] = imp;
                        }
                        b.imports.push(imp);
                    } else {
                        p.sc.mark("import already exists ", alias);
                    }
                } else if (Object.keys(cache).length > 0){
                    stop = true;
                } else {
                    p.sc.mark("nothing to import");
                }
            }
        }
    };

    p.typ = function (ft) {
        should.ok(p.pr.is(sc.IDENT));
        let tid = p.pr.ident();
        var t = types.find(tid);
        p.pr.next();
        if (!_.isNull(t)){
            ft(t);
        } else {
            p.sc.mark("type not found ", tid);
        }
    };


    p.obj = function (b) {
        should.ok(p.pr.is(sc.IDENT));
        let id = p.pr.ident();
        p.pr.next();
        var sel = ast.selector();
        sel.module = p.tgt.mod.name;
        sel.name = id;
        return sel;
    };

    p.stmt = function (b) {
        b.stmts = [];
        p.pr.pass(sc.SEPARATOR, sc.DELIMITER);
        if(p.pr.is(sc.END)){
            console.log("end");
            //do nothing, handled in .block
        } else { //expr -> obj
            var e = new Expression(b);
            console.log(e.value);
            p.pr.expect(sc.ASSIGN, sc.SEPARATOR, sc.DELIMITER);
            p.pr.next();
            var a = ast.stmt().assign();
            a.expression = e.value;
            p.pr.expect(sc.IDENT, sc.SEPARATOR, sc.DELIMITER);
            a.selector = p.obj(b);
            b.stmts.push(a);
        }
    };

    p.vars = function (b) {
        should.ok(p.pr.is(sc.VAR));
        p.pr.next();
        for(var stop = false; !stop;){
            if(p.pr.wait(sc.IDENT, sc.DELIMITER, sc.SEPARATOR)){
                var il = [];
                for(;;){
                    var id = p.pr.ident();
                    if(!b.objects.hasOwnProperty(id)) {
                        il.push(id);
                    } else {
                        p.sc.mark("identifiers already exists ", id);
                    }
                    p.pr.next();
                    if(p.pr.wait(sc.COMMA, sc.DELIMITER)){
                        p.pr.next();
                        p.pr.pass(sc.DELIMITER);
                    } else {
                        break;
                    }
                }
                if(p.pr.wait(sc.IDENT, sc.DELIMITER)){
                    p.typ(function (t) {
                        il.forEach(function (v) {
                            console.log(v);
                            should.ok(!b.objects.hasOwnProperty(v));
                            var vr = ast.variable();
                            vr.name = v;
                            vr.type = t;
                            b.objects[v] = vr;
                        });
                    });
                } else {
                    p.sc.mark("type or identifier expected");
                }
            } else {
                stop = true;
            }
        }
    };

    p.block = function (b, sym) {
        if(_.isEqual(sym, sc.UNIT)){
            if(p.pr.wait(sc.VAR, sc.DELIMITER, sc.SEPARATOR)) {
                p.vars(b);
            }
            p.tgt.mod.objects = b.objects;
            if(p.pr.wait(sc.START, sc.DELIMITER, sc.SEPARATOR)){
                p.pr.next();
                p.stmt(b);
                p.tgt.mod.start = b.stmts;
            } else if (!(p.pr.is(sc.STOP) || p.pr.is(sc.END))){
                p.sc.mark("END expected but ", p.pr.sym.code, " found");
            }
            if(p.pr.wait(sc.STOP, sc.DELIMITER, sc.SEPARATOR)){
                p.pr.next();
                p.stmt(b);
                p.tgt.mod.stop = b.stmts;
            }
        } else {
            p.sc.mark("unexpected block type ", sym.code);
        }
    };

    p.mod = function () {
        p.pr.expect(sc.UNIT, sc.SEPARATOR, sc.DELIMITER);
        p.pr.next();
        p.pr.expect(sc.IDENT, sc.DELIMITER);
        var mod = p.pr.ident();
        p.pr.next();
        p.tgt = rerequire("./target.js")(mod);
        var block = p.tgt.pushBlock();
        p.imp(block);
        p.tgt.mod.imports = block.imports;
        return new Promise(function (res, rej) {
            Promise.all(p.resolvers).then(function () {
                p.block(block, sc.UNIT);
                p.tgt.popBlock();
                p.pr.expect(sc.END, sc.SEPARATOR, sc.DELIMITER);
                p.pr.next();
                p.pr.expect(sc.IDENT, sc.DELIMITER);
                if(!_.isEqual(mod, p.pr.ident()))
                    p.sc.mark("wrong module name");
                p.pr.next();
            }).then(function () {
                res(p.tgt.result());
            })//.catch(error => {console.trace(error);});
        });;
    };

     p.pr.next();
}

module.exports = function (sc, resolver) {
    return new Parser(sc, resolver);
};