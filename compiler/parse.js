/**
 * Created by petry_000 on 12.05.2016.
 */
const should = require("should");
const _ = require("underscore");
const ast = rerequire("./ir/ast.js");

function Parser(sc, resolver) {
    const p = this; //use with care within closures...

    p["pr"] = rerequire("./help.js")(sc);
    p["sc"] = sc;
    p["tgt"] = null;
    p["resolvers"] = [];

    
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

    p.typ = function () {
        should.ok(p.pr.is(sc.IDENT));
        p.pr.next();
    };

    p.stmt = function (b) {
        b.stmts = [];
    };

    p.vars = function (b) {
        should.ok(p.pr.is(sc.VAR));
        p.pr.next();
        for(var stop = false; !stop;){
            if(p.pr.wait(sc.IDENT, sc.DELIMITER, sc.SEPARATOR)){
                var il = [];
                for(;;){
                    var id = p.pr.ident();
                    il.push(id);
                    p.pr.next();
                    if(p.pr.wait(sc.COMMA, sc.DELIMITER)){
                        p.pr.next();
                        p.pr.pass(sc.DELIMITER);
                    } else {
                        break;
                    }
                }
                if(p.pr.wait(sc.IDENT, sc.DELIMITER)){
                    p.typ();
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
            if(p.pr.wait(sc.START, sc.DELIMITER, sc.SEPARATOR)){
                p.pr.next();
                p.stmt(b);
            } else if (!(p.pr.is(sc.STOP) || p.pr.is(sc.END))){
                p.sc.mark("END expected but ", p.pr.sym.code, " found");
            }
            p.tgt.mod.start = b.stmts;
            if(p.pr.wait(sc.STOP, sc.DELIMITER, sc.SEPARATOR)){
                p.pr.next();
                p.stmt(b)
            }
            p.tgt.mod.stop = b.stmts;
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
            });
        });
    };

     p.pr.next();
}

module.exports = function (sc, resolver) {
    return new Parser(sc, resolver);
};