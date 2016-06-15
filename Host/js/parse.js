/* Created by kpmy on 12.05.2016 */
const should = require("should");
const _ = require("underscore");

const ast = rerequire("./ir/ast.js");
const tpl = rerequire("./ir/tpl.js");
const types = rerequire("./ir/types.js")();

function Parser(sc, resolver) {
    const p = this; //use with care within closures...

    p["pr"] = rerequire("./help.js")(sc);
    p["sc"] = sc;
    p["tgt"] = null;
    p["resolvers"] = [];

    function Template(rid) {
        const struct = tpl.struct();
        const instr = tpl.instr();
        const t = this;

        t.ii = [];

        t.emit = function (i) {
            t.ii.push(i);
        };

        t.qualident = function () {
            should.ok(p.pr.is(sc.IDENT));
            var id = "";
            var tid = p.pr.identifier(false).id;
            p.pr.next();
            if (p.pr.is(sc.TILD)) {
                p.pr.expect(sc.IDENT, sc.TILD);
                id = p.pr.identifier(false).id;
                p.pr.next();
            } else {
                id = tid;
                tid = "";
            }
            return {"id": id, "tid": tid}
        };

        t.block = function () {
            p.pr.expect(sc.IDENT, sc.SEPARATOR, sc.DELIMITER);
            var bid = t.qualident();
            if (p.pr.wait(sc.LPAREN)) {
                p.pr.next();
                p.pr.expect(sc.IDENT);
                bid.uid = p.pr.identifier(false).id;
                p.pr.next();
                p.pr.expect(sc.RPAREN);
                p.pr.next();
            }
            var em = new instr.Emit(bid.tid, bid.id, bid.uid);
            t.emit(em);

            let inner = function (e) {
                for (var stop = false; !stop;) {
                    e.children++;
                    p.pr.pass(sc.SEPARATOR, sc.DELIMITER);
                    if (p.pr.is(sc.IDENT)) {
                        t.block();
                    } else if (p.pr.is(sc.NUM)) {
                        var pt = new instr.Put();
                        var value = p.pr.num();
                        pt.type = value.type;
                        pt.value = value.value;
                        t.emit(pt);
                        p.pr.next();
                    } else if (p.pr.is(sc.MINUS)) {
                        p.pr.next();
                        var pt = new instr.Put();
                        if (p.pr.wait(sc.NUMBER)) {
                            var value = p.pr.num();
                            pt.type = value.type;
                            pt.value = -value.value;
                        } else {
                            p.sc.mark("number expected");
                        }
                        t.emit(pt);
                    } else if (p.pr.is(sc.STR)) {
                        var pt = new instr.Put();
                        pt.type = types.STRING;
                        pt.value = p.pr.sym.value;
                        p.pr.next();
                        if (p.pr.wait(sc.COLON, sc.DELIMITER, sc.SEPARATOR)) {
                            p.pr.next();
                            for (; ;) {
                                if (p.pr.wait(sc.STR, sc.DELIMITER)) {
                                    pt.value = pt.value.concat(p.pr.sym.value);
                                    p.pr.next();
                                } else if (p.pr.is(sc.NUM)) {
                                    var num = p.pr.num();
                                    if (_.isEqual(num.type, types.CHAR)) {
                                        pt.value = pt.value.concat(num.value);
                                    } else {
                                        p.sc.mark("concat only char and string");
                                    }
                                    p.pr.next();
                                }
                                if (p.pr.wait(sc.COLON, sc.DELIMITER)) {
                                    p.pr.next();
                                } else {
                                    break;
                                }
                            }
                        }
                        t.emit(pt);
                    } else if (p.pr.in(sc.TRUE, sc.FALSE, sc.NIL)) {
                        var pt = new instr.Put();
                        pt.type = types.TRILEAN;
                        pt.value = p.pr.is(sc.NIL) ? null : p.pr.is(sc.FALSE) ? false : true;
                        t.emit(pt);
                        p.pr.next();
                    } else if (p.pr.is(sc.DOG)) {
                        p.pr.next();
                        p.pr.expect(sc.IDENT);
                        var pt = new instr.Put();
                        pt.type = types.POINTER;
                        pt.value = p.pr.identifier(false).id;
                        p.pr.next();
                        t.emit(pt);
                    } else if (p.pr.is(sc.SEMICOLON)) {
                        em.children--;
                        stop = true;
                    } else {
                        p.sc.mark(`unexpected sym ${p.pr.sym.code}`);
                    }
                }
            };

            let down = function (reuse) {
                t.emit(new instr.Dive(reuse));
                p.pr.next();
                inner(em);
                p.pr.expect(sc.SEMICOLON, sc.DELIMITER, sc.SEPARATOR);
                t.emit(new instr.Rise());
                if (em.children == 0)
                    p.pr.mark(":/:: is redundant for empty block");
                p.pr.next();
            };

            if (p.pr.wait(sc.COLON)) {
                down(false);
            } else if (p.pr.is(sc.BRICK)) {
                down(true);
            } else {
                //empty
            }
        };

        p.sc.strict = true;
        t.root = new struct.Leaf();
        t.root.qid = new struct.Qualident(undefined, rid);
        t.root.clazz = new struct.Clazz(undefined, rid);
        p.pr.pass(sc.SEPARATOR, sc.DELIMITER);
        t.block();
        p.pr.expect(sc.SEMICOLON, sc.SEPARATOR, sc.DELIMITER);
        p.sc.strict = false; //turn of semicolons
        p.pr.next();
        var ret = struct.run(t.ii);
        ret.up = t.root;
        t.root.children.push(ret);
        //console.dir(t.root, {depth: null});
    }
    
    function Expression() {
        const e = this;

        e.value = null;
        e.stack = [];

        function existsBlock(obj, noFuture) {
            var exists = p.tgt.isBlock(obj.module, obj.name);
            if (!exists && _.isEqual(obj.module, p.tgt.mod.name) && _.isUndefined(noFuture)) {
                var mark = sc.futureMark(`block ${obj.module} ${obj.name} not found`);
                var f = function () {
                    var std = p.tgt.std();
                    if (p.tgt.isBlock(obj.module, obj.name)) {
                        //ok
                    } else if (!_.isNull(std.thisBlock(obj.name))) {
                        obj.module = "$std";
                        obj.fix(obj);
                    } else {
                        mark();
                    }
                };
                p.tgt._resolvers.push(f);
            } else if (!exists && _.isUndefined(noFuture)) {
                p.sc.mark("imported object or block not found");
            }
            return exists;
        }

        e.pop = function () {
            //console.log("pop");
            should.ok(!_.isEmpty(e.stack));
            return e.stack.pop();
        };

        e.push = function (x) {
            if (ast.is(x).type("DyadicOp")) {
                x.right = e.pop();
                x.left = e.pop();
            } else if (ast.is(x).type("MonadicOp")) {
                x.expr = e.pop();
            } else if (ast.is(x).type("InfixExpr")) {
                x.params.length = x.arity;
                for (var i = x.arity - 1; i >= 0; i--) {
                    x.params[i] = e.pop();
                }
            } else if (x instanceof Expression) {
                x = x.value;
            }
            //console.log("push", JSON.stringify(x));
            e.stack.push(x);
        };

        e.noCall = function () {
            if (ast.is(e.value).type("CallExpr")) {
                if (e.value.pure) {
                    var ref = ast.expr().constant(types.BLOCK, `${e.value.module}.${e.value.name}`);
                    e.value.fix = function (c) { //fix для ссылок на стандартные функции
                        ref.value = `${c.module}.${c.name}`;
                    };
                    e.value = ref;
                } else
                    p.sc.mark("call is not an expression");
            }
            return e;
        };

        e.factor = function () { // ~ ! {} [] ...
            if (p.pr.is(sc.NUM)) {
                var n = p.pr.num();
                e.push(ast.expr().constant(n.type, n.value));
                p.pr.next();
            } else if (p.pr.is(sc.STR)) {
                var s = p.pr.sym;
                if (s.apos && s.value.length == 1) {
                    e.push(ast.expr().constant(types.CHAR, s.value))
                } else {
                    e.push(ast.expr().constant(types.STRING, s.value));
                }
                p.pr.next();
            } else if (p.pr.is(sc.DOG)) {
                p.pr.next();
                p.pr.expect(sc.IDENT);
                var id = p.pr.identifier(false);
                p.pr.next();
                if (p.pr.wait(sc.COLON)) {
                    p.pr.next();
                    var t = new Template(id.id);
                    var c = ast.expr().constant(types.ATOM, id.id);
                    c.structure = t.root;
                    e.push(c);
                } else {
                    e.push(ast.expr().constant(types.ATOM, id.id));
                }
            } else if (p.pr.is(sc.TYPE)) {
                p.pr.next();
                p.pr.expect(sc.COLON);
                p.pr.next();
                var t = new Template("TYPE");
                var c = ast.expr().constant(types.TYPE, t.root);
                e.push(c);
            } else if (p.pr.is(sc.IDENT)) {
                var obj = p.obj(p.tgt.block());
                if (ast.is(obj).type("Selector")) {
                    e.push(ast.expr().select(obj));
                } else if (ast.is(obj).type("CallExpr")) {
                    existsBlock(obj);
                    e.push(obj)
                } else {
                    p.sc.mark(`invalid object or call`);
                }
                //p.pr.next(); done later
            } else if (p.pr.is(sc.TRUE) || p.pr.is(sc.FALSE)) {
                e.push(ast.expr().constant(types.BOOLEAN, p.pr.is(sc.TRUE)));
                p.pr.next();
            } else if (p.pr.is(sc.NONE)) {
                e.push(ast.expr().constant(types.ANY, "NONE"));
                p.pr.next();
            } else if (p.pr.is(sc.LBRACE)) {
                p.pr.next();
                var val = [];
                if (!p.pr.wait(sc.RBRACE, sc.DELIMITER)) {
                    for (var stop = false; !stop;) {
                        var k = new Expression().noCall();
                        p.pr.expect(sc.COLON, sc.DELIMITER);
                        p.pr.next();
                        var v = new Expression().noCall();
                        val.push([k.value, v.value]);
                        if (!p.pr.wait(sc.COMMA, sc.DELIMITER)) {
                            stop = true;
                        } else {
                            p.pr.next();
                        }
                    }
                    p.pr.expect(sc.RBRACE);
                }
                p.pr.next();
                e.push(ast.expr().constant(types.MAP, val));
            } else if (p.pr.is(sc.LBRAK)) {
                p.pr.next();
                var val = [];
                if (!p.pr.wait(sc.RBRAK, sc.DELIMITER)) {
                    for (var stop = false; !stop;) {
                        var v = new Expression().noCall();
                        val.push(v.value);
                        if (!p.pr.wait(sc.COMMA, sc.DELIMITER)) {
                            stop = true;
                        } else {
                            p.pr.next();
                        }
                    }
                    p.pr.expect(sc.RBRAK);
                }
                p.pr.next();
                e.push(ast.expr().constant(types.LIST, val));
            } else if (p.pr.is(sc.LBRUX)) {
                p.pr.next();
                var val = [];
                if (!p.pr.wait(sc.RBRUX, sc.DELIMITER)) {
                    for (var stop = false; !stop;) {
                        var v = new Expression().noCall();
                        val.push(v.value);
                        if (!p.pr.wait(sc.COMMA, sc.DELIMITER)) {
                            stop = true;
                        } else {
                            p.pr.next();
                        }
                    }
                    p.pr.expect(sc.RBRUX);
                }
                p.pr.next();
                e.push(ast.expr().constant(types.SET, val));
            } else if (p.pr.is(sc.LPAREN)) {
                p.pr.next();
                var ee = new Expression();
                p.pr.expect(sc.RPAREN, sc.DELIMITER);
                p.pr.next();
                e.push(ee);
            } else if (p.pr.is(sc.TILD)) {
                p.pr.next();
                e.factor();
                p.pr.pass(sc.DELIMITER);
                e.push(ast.expr().monadic(sc.TILD.code));
            } else if (p.pr.is(sc.FIX)) {
                p.pr.next();
                p.pr.expect(sc.IDENT);
                var inf = null;
                var obj = p.obj(p.tgt.block());
                if (ast.is(obj).type("Selector")) {
                    var o = p.tgt.thisObj(obj);
                    if (_.isEqual(o.type.name, "BLOCK")) {
                        inf = ast.expr().infix();
                        inf.selector = obj;
                        inf.arity = 1;
                        if (!_.isEmpty(obj.inside)) {
                            p.sc.mark("parameters not allowed")
                        }
                    } else {
                        p.sc.mark("not a block reference");
                    }
                } else if (ast.is(obj).type("CallExpr")) {
                    existsBlock(obj);
                    if (!obj.pure) { //TODO проверка параметров
                        p.sc.mark("parameters not allowed")
                    }
                    inf = ast.expr().infix();
                    inf.expression = obj;
                    inf.arity = 1;
                } else {
                    p.sc.mark(`invalid object or block`);
                }
                should.exist(inf);
                e.push(new Expression());
                e.push(inf);
            } else {
                p.sc.mark("invalid expression ", p.pr.sym.code);
            }
        };

        e.cpx = function () { // +! -!
            e.factor();
        };

        e.power = function () { // ^
            e.cpx();
        };

        e.product = function () { // * / // %
            p.pr.pass(sc.DELIMITER);
            e.power();
            for (var stop = false; !stop;) {
                p.pr.pass(sc.DELIMITER);
                if (p.pr.is(sc.TIMES)) {
                    var op = p.pr.sym.code;
                    p.pr.next();
                    p.pr.pass(sc.DELIMITER);
                    e.power();
                    e.push(ast.expr().dyadic(op));
                } else {
                    stop = true;
                }
            }
        };

        e.quantum = function () { // -- + -
            if (p.pr.is(sc.MINUS)) {
                p.pr.next();
                p.pr.pass(sc.DELIMITER);
                e.product();
                e.push(ast.expr().monadic(sc.MINUS.code));
            } else {
                p.pr.pass(sc.DELIMITER);
                e.product();
            }
            for (var stop = false; !stop;) {
                p.pr.pass(sc.DELIMITER);
                if (p.pr.in(sc.PLUS, sc.MINUS)) {
                    var op = p.pr.sym.code;
                    p.pr.next();
                    p.pr.pass(sc.DELIMITER);
                    e.product();
                    e.push(ast.expr().dyadic(op));
                } else {
                    stop = true;
                }
            }
        };

        e.compare = function () { // = # < <= => >
            p.pr.pass(sc.DELIMITER);
            e.quantum();
            p.pr.pass(sc.DELIMITER);
            if (p.pr.in(sc.EQL, sc.NEQ, sc.GEQ, sc.LEQ, sc.LSS, sc.GTR)) {
                var op = p.pr.sym.code;
                p.pr.next();
                p.pr.pass(sc.DELIMITER);
                e.quantum();
                e.push(ast.expr().dyadic(op));
            }
        };

        e.and = function () { // &
            p.pr.pass(sc.DELIMITER);
            e.compare();
            for (var stop = false; !stop;) {
                p.pr.pass(sc.DELIMITER);
                if (p.pr.is(sc.AMP)) {
                    p.pr.next();
                    p.pr.pass(sc.DELIMITER);
                    e.compare();
                    e.push(ast.expr().dyadic(sc.AMP.code));
                } else {
                    stop = true;
                }
            }
        };

        e.or = function () { // |
            p.pr.pass(sc.DELIMITER);
            e.and();
            for (var stop = false; !stop;) {
                p.pr.pass(sc.DELIMITER);
                if (p.pr.is(sc.PIPE)) {
                    p.pr.next();
                    p.pr.pass(sc.DELIMITER);
                    e.and();
                    e.push(ast.expr().dyadic(sc.PIPE.code));
                } else {
                    stop = true;
                }
            }
        };

        e.expression = function () { //  ? :
            e.or();
            p.pr.pass(sc.DELIMITER);
            if (p.pr.is(sc.FIX)) {
                p.pr.next();
                p.pr.expect(sc.IDENT);
                var inf = null;
                var obj = p.obj(p.tgt.block());
                if (ast.is(obj).type("Selector")) {
                    var o = p.tgt.thisObj(obj);
                    if (_.isEqual(o.type.name, "BLOCK")) {
                        inf = ast.expr().infix();
                        inf.selector = obj;
                        inf.arity = 2;
                        if (!_.isEmpty(obj.inside)) {
                            p.sc.mark("parameters not allowed")
                        }
                    } else {
                        p.sc.mark("not a block reference");
                    }
                } else if (ast.is(obj).type("CallExpr")) {
                    existsBlock(obj);
                    if (!obj.pure) { //TODO проверка параметров
                        p.sc.mark("parameters not allowed")
                    }
                    inf = ast.expr().infix();
                    inf.expression = obj;
                    inf.arity = 2;
                } else {
                    p.sc.mark(`invalid object or block`);
                }
                should.exist(inf);
                e.push(new Expression());
                for (var stop = false; !stop;) {
                    if (p.pr.wait(sc.COMMA, sc.DELIMITER)) {
                        p.pr.next();
                        e.push(new Expression());
                        inf.arity++;
                    } else {
                        stop = true;
                    }
                }
                e.push(inf);
            }
        };

        p.pr.pass(sc.DELIMITER, sc.SEPARATOR);
        e.expression();
        e.value = e.stack.pop();
        should.ok(_.isEmpty(e.stack));
    }

    p.resolve = function (name) {
        return resolver(name);
    };

    p.imp = function (b) {
        var cache = {};
        while (p.pr.wait(sc.IMPORT, sc.SEPARATOR, sc.DELIMITER)) {
            p.pr.next();
            for (var stop = false; !stop;) {
                if (p.pr.wait(sc.IDENT, sc.SEPARATOR, sc.DELIMITER)) {
                    should.ok(!p.isMod());
                    const name = p.pr.identifier().id;
                    var alias = "";
                    p.pr.next();
                    if (p.pr.wait(sc.ASSIGN, sc.DELIMITER)) {
                        p.pr.next();
                        p.pr.expect(sc.IDENT, sc.DELIMITER);
                        alias = p.pr.identifier().id;
                        p.pr.next();
                    }
                    var imp = ast.imp();
                    if (!b.hasImport(alias)) {
                        if (_.isEqual(name, p.tgt.mod.name)) {
                            p.sc.mark("module cannot import itself");
                        }
                        imp.name = name;
                        imp.alias = alias;
                        imp.def = p.resolve(name);
                        /*if (!cache.hasOwnProperty(name)) {
                            var noCycleCheck = function (def) {
                                cache[name].def = def;
                                const noCycle = function (i) {
                                    i.def.imports.forEach(function (ii) {
                                        if (_.isEqual(ii, p.tgt.mod.name)) {
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
                         }*/ //TODO проверить циклический импорт
                        b.imports.push(imp);
                        cache[name] = imp;
                    } else {
                        p.sc.mark("import already exists ", alias);
                    }
                } else if (Object.keys(cache).length > 0) {
                    stop = true;
                } else {
                    p.sc.mark("nothing to import");
                }
            }
        }
    };

    p.typ = function (ft) {
        should.ok(p.pr.is(sc.IDENT));
        let tid = p.pr.identifier();
        if (_.isNull(tid.module)) {
            var t = types.find(tid.id);
            p.pr.next();
            if (!_.isNull(t)) {
                ft(t);
            } else if (p.tgt.block().objects.hasOwnProperty(tid.id)) {
                var c = p.tgt.block().objects[tid.id];
                if (ast.is(c).type("Constant")) {
                    if (_.isEqual(c.expression.type, types.TYPE)) {
                        t = types.userType(tid.id);
                        t.value = c.expression.value;
                        ft(t);
                    } else {
                        p.sc.mark("not a type");
                    }
                } else {
                    p.sc.mark("variable types not supported for now");
                }
            } else {
                p.sc.mark("type identifier not found");
            }
        } else {
            p.sc.mark("not supported");
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
        var pure = true;
        var deref = false;
        var cascade = 0;
        for (var stop = false; !stop;) {
            if (p.pr.wait(sc.DOLLAR)) {
                p.pr.next();
                pure = false;
                deref = true;
                sel.inside.push(ast.expr().deref());
            } else if (p.pr.wait(sc.LBRAK)) {
                p.pr.next();
                if (cascade) {
                    sel.inside.push(ast.expr().dot());
                }
                for (var end = false; !end;) {
                    var e = new Expression();
                    if (!ast.is(e.value).type("CallExpr")) {
                        sel.inside.push(e.value);
                    } else {
                        p.sc.mark("wrong expr")
                    }
                    if (p.pr.wait(sc.COMMA, sc.DELIMITER, sc.SEPARATOR)) {
                        p.pr.next();
                    } else {
                        end = true;
                    }
                }
                p.pr.expect(sc.RBRAK, sc.DELIMITER);
                p.pr.next();
                cascade++;
                pure = false;
            } else {
                stop = true;
            }
        }
        if (p.tgt.isObj(sel.module, sel.name)) {
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
                    if (!p.tgt.block().objects.hasOwnProperty(sel.name)) {
                        p.sc.mark(`identifier not found ${sel.name}`);
                    }
                }
            }
            return sel;
        } else if (foreign && !p.tgt.isBlock(sel.module, sel.name)) {
            p.sc.mark(`identifier not found ${sel.module} ${sel.name}`);
        } else {
            if (deref || cascade > 1)
                p.sc.mark("multiple selectors not allowed here");

            var call = ast.expr().call(sel.module, sel.name);
            sel.inside.forEach(x => {
                call.params.push(call.param(x));
            });
            call.pure = pure;
            return call;
        }
    };

    p.stmts = function (b) {
        b.stmts = [];
        for (var stop = false; !stop;) {
            p.pr.pass(sc.SEPARATOR, sc.DELIMITER);
            if (p.pr.in(sc.END, sc.ELSE, sc.ELSIF, sc.UNTIL)) {
                //do nothing, handled in .block
                stop = true;
            } else if (p.pr.is(sc.IF)) {
                var i = ast.stmt().cond();
                var first = true;
                for (var brk = false; !brk;) {
                    if ((first && p.pr.is(sc.IF)) || p.pr.is(sc.ELSIF)) {
                        first = false;
                        p.pr.next();
                        var e = new Expression();
                        p.pr.expect(sc.THEN, sc.SEPARATOR, sc.DELIMITER);
                        p.pr.next();
                        var os = b.stmts;
                        p.stmts(b);
                        var ns = b.stmts;
                        b.stmts = os;
                        var br = i.branch();
                        br.condition = e.value;
                        br.sequence = ns;
                        i.branches.push(br);
                    } else if (p.pr.is(sc.ELSE)) {
                        p.pr.next();
                        var os = b.stmts;
                        p.stmts(b);
                        var ns = b.stmts;
                        b.stmts = os;
                        i.otherwise = ns;
                        p.pr.expect(sc.END, sc.DELIMITER, sc.SEPARATOR);
                        p.pr.next();
                        brk = true;
                    } else if (p.pr.is(sc.END)) {
                        p.pr.next();
                        brk = true;
                    } else {
                        p.sc.mark(`unexpected ${p.pr.sym.code}`);
                    }
                }
                b.stmts.push(i);
            } else if (p.pr.is(sc.WHILE)) {
                var w = ast.stmt().cycle();
                var first = true;
                for (var brk = false; !brk;) {
                    if ((first && p.pr.is(sc.WHILE)) || p.pr.is(sc.ELSIF)) {
                        first = false;
                        p.pr.next();
                        var e = new Expression();
                        p.pr.expect(sc.DO, sc.SEPARATOR, sc.DELIMITER);
                        p.pr.next();
                        var os = b.stmts;
                        p.stmts(b);
                        var ns = b.stmts;
                        b.stmts = os;
                        var br = w.branch();
                        br.condition = e.value;
                        br.sequence = ns;
                        w.branches.push(br);
                    } else if (p.pr.is(sc.END)) {
                        p.pr.next();
                        brk = true;
                    } else {
                        p.sc.mark(`unexpected ${p.pr.sym.code}`);
                    }
                }
                b.stmts.push(w);
            } else if (p.pr.is(sc.REPEAT)) {
                var u = ast.stmt().invCycle();
                p.pr.next();
                var os = b.stmts;
                p.stmts(b);
                var ns = b.stmts;
                b.stmts = os;
                var br = u.branch();
                br.sequence = ns;
                p.pr.expect(sc.UNTIL, sc.SEPARATOR, sc.DELIMITER);
                p.pr.next();
                var e = new Expression();
                br.condition = e.value;
                u.value = br;
                b.stmts.push(u);
            } else { //expr -> obj
                var e = new Expression();
                //console.log(e.value);
                if (ast.is(e.value).type("CallExpr")) {
                    if (!p.pr.wait(sc.ASSIGN, sc.DELIMITER)) {
                        var c = ast.stmt().call();
                        c.expression = e.value;
                        b.stmts.push(c);
                    } else if (e.value.pure) { //block reference
                        e.noCall(); //e.value = ast.expr().constant(types.BLOCK, `${e.value.module}.${e.value.name}`);
                    } else {
                        p.sc.mark("not an expression");
                    }
                } else {
                    p.pr.wait(sc.ASSIGN, sc.SEPARATOR, sc.DELIMITER);
                }
                if (p.pr.is(sc.ASSIGN)) {
                    p.pr.next();
                    var a = ast.stmt().assign();
                    a.expression = e.value;
                    p.pr.expect(sc.IDENT, sc.SEPARATOR, sc.DELIMITER);
                    a.selector = p.obj(b);
                    should.ok(ast.is(a.selector).type("Selector"));
                    if (!p.tgt.compatibleTypes(a.selector, a.expression)) {
                        p.sc.mark("incompatible types");
                    }
                    var o = p.tgt.thisObj(a.selector);
                    if (!_.isUndefined(o.expression) || !_.isEqual(a.selector.module, p.tgt.mod.name) && !_.isEqual(o.modifier, "rw") && _.isEmpty(a.selector.inside)) {
                        p.sc.mark("can't assign to read-only object");
                    }
                    b.stmts.push(a);
                } else {
                    if (ast.is(e.value).type("SelectExpr")) {
                        var obj = p.tgt.thisObj(e.value.selector);
                        if (_.isEqual(obj.type.name, "BLOCK")) {
                            var a = ast.stmt().call();
                            a.selector = e.value.selector;
                            b.stmts.push(a);
                        } else {
                            p.sc.mark("not a statement");
                        }
                    } else if (ast.is(e.value).type("CallExpr")) {
                        //do nothing
                    } else {
                        p.sc.mark("not a statement");
                    }
                }
            }
        }
    };

    p.consts = function (b) {
        should.ok(p.pr.is(sc.CONST));
        p.pr.next();
        for (var stop = false; !stop;) {
            p.pr.pass(sc.DELIMITER, sc.SEPARATOR);
            var e = new Expression();
            var id = null;
            var cs = ast.constant();
            if(ast.is(e.value).type("ConstExpr") && _.isEqual(e.value.type, types.ATOM)){
                id = {id: e.value.value};
                if (b.objects.hasOwnProperty(id.id)) {
                    p.sc.mark("identifier already exists");
                }
                cs.mod = "r";
            } else {
                p.pr.expect(sc.ASSIGN, sc.DELIMITER);
                p.pr.next();
                p.pr.expect(sc.IDENT, sc.DELIMITER);
                id = p.pr.identifier(false);
                if (b.objects.hasOwnProperty(id.id)) {
                    p.sc.mark("identifier already exists");
                }
                p.pr.next();
            }
            cs.name = id.id;
            cs.expression = e.value;
            if (p.pr.wait(sc.TIMES)) {
                p.pr.next();
                cs.modifier = "r";
            }
            b.objects[cs.name] = cs;

            p.pr.pass(sc.DELIMITER, sc.SEPARATOR);
            if (p.pr.in(sc.VAR, sc.CONST, sc.START, sc.BLOCK, sc.END)) {
                stop = true;
            }
        }
    };

    p.vars = function (b) {
        should.ok(p.pr.is(sc.VAR));
        p.pr.next();
        for (var stop = false; !stop;) {
            if (p.pr.wait(sc.IDENT, sc.DELIMITER, sc.SEPARATOR)) {
                var il = [];
                for (; ;) {
                    should.ok(!p.isMod());
                    var o = {
                        id: p.pr.identifier().id,
                        mod: null
                    };
                    if (!b.objects.hasOwnProperty(o.id)) {
                        il.push(o);
                    } else {
                        p.sc.mark("identifiers already exists ", o.id);
                    }
                    p.pr.next();
                    if (p.pr.wait(sc.TIMES)) {
                        p.pr.next();
                        o.mod = "rw";
                    } else if (p.pr.is(sc.MINUS)) {
                        p.pr.next();
                        o.mod = "r";
                    } else {
                        o.mod = "";
                    }
                    if (p.pr.wait(sc.COMMA, sc.DELIMITER)) {
                        p.pr.next();
                        p.pr.pass(sc.DELIMITER);
                    } else {
                        break;
                    }
                }
                var ft = function (t) {
                    il.forEach(function (v) {
                        //console.log(v);
                        should.ok(!b.objects.hasOwnProperty(v.id));
                        var vr = ast.variable();
                        vr.name = v.id;
                        vr.type = t;
                        vr.modifier = v.mod;
                        b.objects[v.id] = vr;
                    });
                };
                if (p.pr.wait(sc.IDENT, sc.DELIMITER)) {
                    p.typ(ft);
                } else if (p.pr.is(sc.TYPE)) {
                    ft(types.find("TYPE"));
                    p.pr.next();
                } else if (p.pr.is(sc.BLOCK)) {
                    ft(types.find("BLOCK"));
                    p.pr.next();
                } else {
                    p.sc.mark("type or identifier expected");
                }
            } else {
                stop = true;
            }
        }
    };

    p.block = function (b, sym) {
        if (_.isEqual(sym, sc.UNIT)) {
            while (p.pr.wait(sc.CONST, sc.DELIMITER, sc.SEPARATOR)) {
                p.consts(b);
            }
            while (p.pr.wait(sc.VAR, sc.DELIMITER, sc.SEPARATOR)) {
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
                block.exported = pb.exported;
                block.infix = pb.infix;
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
        } else if (_.isEqual(sym, sc.BLOCK)) {
            p.pr.expect(sc.IDENT, sc.DELIMITER);
            should.ok(!p.isMod());
            var name = p.pr.identifier().id;
            if (p.tgt.isBlock(p.tgt.mod.name, name))
                p.sc.mark(`identifier already exists ${name}`);

            b.name = name;
            p.pr.next();
            if (p.pr.wait(sc.TIMES)) {
                p.pr.next();
                b.exported = true;
            }
            while (p.pr.wait(sc.VAR, sc.DELIMITER, sc.SEPARATOR)) {
                p.vars(b);
            }
            if (p.pr.wait(sc.PAR, sc.DELIMITER, sc.SEPARATOR)) {
                if (Object.keys(b.objects).length == 0) {
                    p.sc.mark("nothing in parameters");
                }
                p.pr.next();
                b.infix = false;
                if (p.pr.wait(sc.INFIX, sc.DELIMITER)) {
                    b.infix = true;
                    p.pr.next();
                }
                var order = 0;
                var pl = [];
                for (var stop = false; !stop;) {
                    p.pr.expect(sc.IDENT, sc.DELIMITER);
                    var id = p.pr.identifier();
                    p.pr.next();
                    if (!b.objects.hasOwnProperty(id.id)) {
                        p.sc.mark("unknown param");
                    }
                    var obj = b.objects[id.id];
                    if (_.isObject(obj.param)) {
                        p.sc.mark("duplicate param")
                    }
                    var par = "value";
                    if (p.pr.is(sc.TIMES)) {
                        par = "reference";
                        p.pr.next();
                    }
                    obj.param = ast.formal();
                    obj.param.type = par;
                    obj.param.number = order;
                    pl.push(obj);
                    order++;
                    if (p.pr.wait(sc.COMMA, sc.DELIMITER)) {
                        p.pr.next();
                    } else {
                        stop = true;
                    }
                }
                if (b.infix) {
                    if (pl.length < 2) {
                        p.sc.mark("not enougn params for infix call")
                    }
                    if (pl.length == 2) {
                        if (pl[0].param.type != "reference") {
                            p.sc.mark("invalid unary infix format, reference should be first")
                        }
                    } else {
                        if ((pl[0].param.type == "reference") || (pl[1].param.type != "reference")) {
                            p.sc.mark(`invalid ${pl.length - 1}-ary infix format, reference should be second`)
                        }
                    }
                }
            }
            if (p.pr.wait(sc.BEGIN, sc.DELIMITER, sc.SEPARATOR)) {
                p.pr.next();
                p.stmts(b);
            }
            p.pr.expect(sc.END, sc.DELIMITER, sc.SEPARATOR);
            p.pr.next();
            p.pr.expect(sc.IDENT, sc.DELIMITER);
            should.ok(!p.isMod());
            if (!_.isEqual(b.name, p.pr.identifier().id))
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

        p.block(block, sc.UNIT);
        p.tgt.popBlock();
        p.pr.expect(sc.END, sc.SEPARATOR, sc.DELIMITER);
        p.pr.next();
        p.pr.expect(sc.IDENT, sc.DELIMITER);
        if (!_.isEqual(mod, p.pr.identifier().id))
            p.sc.mark("wrong module name");

        p.tgt._resolvers.forEach(r => r());
        p.pr.next();
        return p.tgt.result()
    };

    p.pr.next();
}

module.exports = function (sc, resolver) {
    return new Parser(sc, resolver);
};