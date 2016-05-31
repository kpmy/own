/* Created by kpmy on 12.05.2016 */
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
            if(p.pr.is(sc.NUM)) {
                var n = p.pr.num();
                e.value = ast.expr().constant(n.type, n.value);
                p.pr.next();
            } else if(p.pr.is(sc.STR)){
                var s = p.pr.sym;
                if(s.apos && s.value.length == 1){
                    e.value = ast.expr().constant(types.CHAR, s.value)
                } else {
                    e.value = ast.expr().constant(types.STRING, s.value);
                }
                p.pr.next();
            } else if(p.pr.is(sc.IDENT)) {
                var obj = p.obj(p.tgt.block());
                //var id = p.pr.identifier(p.isMod());
                //var mod = _.isNull(id.module) ? p.tgt.mod.name : id.module;
                if (ast.is(obj).type("Selector")) {
                    e.value = ast.expr().select(obj);
                } else if (ast.is(obj).type("CallExpr")) {
                    var exists = p.tgt.isBlock(obj.module, obj.name);
                    if (!exists){
                        var mark = sc.futureMark(`block ${obj.module} ${obj.name} not found`);
                        var f = function (res, rej){
                            if(p.tgt.isBlock(obj.module, obj.name)){
                                res();
                            } else {
                                mark();
                            }
                        };
                        p.tgt._resolvers.push(f);
                    }
                    e.value = obj
                } else {
                    p.sc.mark(`invalid object or call`);
                }
                //p.pr.next(); done later
            } else if(p.pr.is(sc.TRUE) || p.pr.is(sc.FALSE)) {
                e.value = ast.expr().constant(types.BOOLEAN, p.pr.is(sc.TRUE));
                p.pr.next();
            } else if(p.pr.is(sc.NONE)) {
                e.value = ast.expr().constant(types.ANY, "NONE");
                p.pr.next();
            } else if(p.pr.is(sc.LBRUX)) {
                p.pr.next();
                var val = [];
                if(!p.pr.wait(sc.RBRUX, sc.DELIMITER)){
                    for (var stop = false; !stop;) {
                        var k = new Expression();
                        p.pr.expect(sc.COLON, sc.DELIMITER);
                        p.pr.next();
                        var v = new Expression();
                        val.push([k.value, v.value]);
                        if (!p.pr.wait(sc.COMMA, sc.DELIMITER)){
                            stop = true;
                        } else {
                            p.pr.next();
                        }
                    }
                    p.pr.expect(sc.RBRUX);
                }
                p.pr.next();
                e.value = ast.expr().constant(types.MAP, val);
            } else if(p.pr.is(sc.LBRAK)){
                p.pr.next();
                var val = [];
                if(!p.pr.wait(sc.RBRAK, sc.DELIMITER)){
                    for (var stop = false; !stop;){
                        var v = new Expression();
                        val.push(v.value);
                        if (!p.pr.wait(sc.COMMA, sc.DELIMITER)){
                            stop = true;
                        } else {
                            p.pr.next();
                        }
                    }
                    p.pr.expect(sc.RBRAK);
                }
                p.pr.next();
                e.value = ast.expr().constant(types.LIST, val);
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

        p.pr.pass(sc.DELIMITER);
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
                    should.ok(!p.isMod());
                    const name = p.pr.identifier().id;
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
                            var noCycleCheck = function (def) {
                                cache[name].def = def;
                                const noCycle = function (i) {
                                    i.def.imports.forEach(function (ii) {
                                        if(_.isEqual(ii, p.tgt.mod.name)){
                                            p.sc.mark("cyclic import from ", i.name);
                                        } else {
                                            p.resolve(ii).then(noCycleCheck);
                                        }
                                    });
                                };
                                noCycle(cache[name]);
                            };
                            p.resolve(name).then(noCycleCheck);
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
        should.ok(!p.isMod());
        let tid = p.pr.identifier().id;
        var t = types.find(tid);
        p.pr.next();
        if (!_.isNull(t)){
            ft(t);
        } else {
            p.sc.mark("type not found ", tid);
        }
    };

    p.isMod = function () {
        should.ok(p.pr.is(sc.IDENT));
        return p.tgt.isMod(p.pr.sym.value);
    };
    
    p.obj = function (b) {
        should.ok(p.pr.is(sc.IDENT));
        const foreign = p.isMod();
        let id = p.pr.identifier(p.isMod());
        p.pr.next();
        var sel = ast.selector();
        sel.module = _.isNull(id.module) ? p.tgt.mod.name : id.module;
        sel.name = id.id;
        if(p.pr.wait(sc.LBRAK, sc.DELIMITER)){
            p.pr.next();
            for(var stop = false;!stop;){
                var e = new Expression(b);
                if(!ast.is(e.value).type("CallExpr")){
                    sel.inside.push(e.value);
                } else {
                    p.sc.mark("wrong expr")
                }
                if(p.pr.wait(sc.COMMA, sc.DELIMITER, sc.SEPARATOR)){
                    p.pr.next();
                } else {
                    stop = true;
                }
            }
            p.pr.expect(sc.RBRAK, sc.DELIMITER);
            p.pr.next();
        }
        if(p.tgt.isObj(sel.module, sel.name)) {
            if (!foreign) {
                if (!p.tgt.block().isModule) {
                    if (p.tgt.block().objects.hasOwnProperty(sel.name)) {
                        sel.block = p.tgt.block().name;
                    } else if (p.tgt.mod.objects.hasOwnProperty(sel.name)) {
                        //do nothing
                    } else {
                        p.sc.mark(`identifier not found ${sel.name}`);
                    }
                } else {
                    if (!p.tgt.mod.objects.hasOwnProperty(sel.name)) {
                        p.sc.mark(`identifier not found ${sel.name}`);
                    }
                }
            } else {
                //TODO check for foreign objects
            }
            return sel;
        } else {
            var call = ast.expr().call(sel.module, sel.name);
            sel.inside.forEach(x => {
                call.params.push(call.param(x));
            });
            return call;
        }
    };

    p.stmts = function (b) {
        b.stmts = [];
        for(var stop = false; !stop;){
            p.pr.pass(sc.SEPARATOR, sc.DELIMITER);
            if (p.pr.is(sc.END)) {
                console.log("end");
                //do nothing, handled in .block
                stop = true;
            } else { //expr -> obj
                var e = new Expression(b);
                console.log(e.value);
                if(ast.is(e.value).type("CallExpr")){
                    if(!p.pr.wait(sc.ASSIGN, sc.DELIMITER)){
                        var c = ast.stmt().call();
                        c.expression = e.value;
                        b.stmts.push(c);
                    } else {
                        p.sc.mark("not an expression");
                    }
                } else {
                    p.pr.expect(sc.ASSIGN, sc.SEPARATOR, sc.DELIMITER);                    
                }
                if(p.pr.is(sc.ASSIGN)) {
                    p.pr.next();
                    var a = ast.stmt().assign();
                    a.expression = e.value;
                    p.pr.expect(sc.IDENT, sc.SEPARATOR, sc.DELIMITER);
                    a.selector = p.obj(b);
                    should.ok(ast.is(a.selector).type("Selector"));
                    //TODO проверить типы слева и справа
                    b.stmts.push(a);
                }
            }
    }
    };

    p.vars = function (b) {
        should.ok(p.pr.is(sc.VAR));
        p.pr.next();
        for(var stop = false; !stop;){
            if(p.pr.wait(sc.IDENT, sc.DELIMITER, sc.SEPARATOR)){
                var il = [];
                for(;;){
                    should.ok(!p.isMod());
                    var id = p.pr.identifier().id;
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
        if(_.isEqual(sym, sc.UNIT)) {
            if (p.pr.wait(sc.VAR, sc.DELIMITER, sc.SEPARATOR)) {
                p.vars(b);
            }
            p.tgt.mod.objects = b.objects;
            
            while (p.pr.wait(sc.BLOCK, sc.DELIMITER, sc.SEPARATOR)) {
                p.pr.next();
                var pb = p.tgt.pushBlock();
                p.block(pb, sc.BLOCK);
                pb = p.tgt.popBlock();
                var block = ast.block();
                block.objects = pb.objects;
                block.sequence = pb.stmts;
                block.name = pb.name;
                b.blocks.push(block);
            }
            p.tgt.mod.blocks = b.blocks;

            if (p.pr.wait(sc.START, sc.DELIMITER, sc.SEPARATOR)) {
                p.pr.next();
                p.stmts(b);
                p.tgt.mod.start = b.stmts;
            } else if (!(p.pr.is(sc.STOP) || p.pr.is(sc.END))) {
                p.sc.mark("END expected but ", p.pr.sym.code, " found");
            }
            
            if (p.pr.wait(sc.STOP, sc.DELIMITER, sc.SEPARATOR)) {
                p.pr.next();
                p.stmts(b);
                p.tgt.mod.stop = b.stmts;
            }
        } else if (_.isEqual(sym, sc.BLOCK)){
            p.pr.expect(sc.IDENT, sc.DELIMITER);
            should.ok(!p.isMod());
            var name = p.pr.identifier().id;
            if(p.tgt.isBlock(p.tgt.mod.name, name))
                p.sc.mark(`identifier already exists ${name}`);

            b.name = name;
            p.pr.next();
            if (p.pr.wait(sc.VAR, sc.DELIMITER, sc.SEPARATOR)) {
                p.vars(b);
            }
            if(p.pr.wait(sc.PAR, sc.DELIMITER, sc.SEPARATOR)){
                if(Object.keys(b.objects).length == 0){
                    p.sc.mark("nothing in parameters");
                }
                p.pr.next();
                var order = 0;
                for(var stop = false; !stop;){
                    p.pr.expect(sc.IDENT, sc.DELIMITER);
                    var id = p.pr.identifier();
                    p.pr.next();
                    if(!b.objects.hasOwnProperty(id.id)){
                        p.sc.mark("unknown param");
                    }
                    if(_.isObject(b.objects[id.id].param)){
                        p.sc.mark("duplicate param")
                    }
                    var par = "value";
                    if(p.pr.is(sc.CIRC)){
                        par = "reference";
                        p.pr.next();
                    }
                    b.objects[id.id].param = ast.formal();
                    b.objects[id.id].param.type = par;
                    b.objects[id.id].param.number = order;
                    order++;
                    if(p.pr.wait(sc.COMMA, sc.DELIMITER)){
                        p.pr.next();
                    } else {
                        stop = true;
                    }
                }
            }
            if(p.pr.wait(sc.BEGIN, sc.DELIMITER, sc.SEPARATOR)){
                p.pr.next();
                p.stmts(b);
            }
            p.pr.expect(sc.END, sc.DELIMITER, sc.SEPARATOR);
            p.pr.next();
            p.pr.expect(sc.IDENT, sc.DELIMITER);
            should.ok(!p.isMod());
            if(!_.isEqual(b.name, p.pr.identifier().id))
                p.sc.mark("block name expected ", pb.name);
            p.pr.next();
        } else {
            p.sc.mark("unexpected block type ", sym.code);
        }
    };

    p.mod = function () {
        p.pr.expect(sc.UNIT, sc.SEPARATOR, sc.DELIMITER);
        p.pr.next();
        p.pr.expect(sc.IDENT, sc.DELIMITER);
        var mod = p.pr.identifier().id;
        p.tgt = rerequire("./target.js")(mod, p.sc);
        var block = p.tgt.pushBlock();
        block.isModule = true;
        block.name = mod;
        p.pr.next();
        p.imp(block);
        p.tgt.mod.imports = block.imports;
        return new Promise(function (res, rej) {
            Promise.all(p.resolvers).then(function () {
                p.block(block, sc.UNIT);
                p.tgt.popBlock();
                p.pr.expect(sc.END, sc.SEPARATOR, sc.DELIMITER);
                p.pr.next();
                p.pr.expect(sc.IDENT, sc.DELIMITER);
                if(!_.isEqual(mod, p.pr.identifier().id))
                    p.sc.mark("wrong module name");
                p.pr.next();
            }).then(function () {
                var pr = [];
                p.tgt._resolvers.forEach((f) => {
                    pr.push(new Promise(f));
                });
                Promise.all(pr).then(function () {
                    res(p.tgt.result());
                });
            })//.catch(error => {console.trace(error);});
        });;
    };

     p.pr.next();
}

module.exports = function (sc, resolver) {
    return new Parser(sc, resolver);
};