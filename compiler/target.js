/* Created by kpmy on 12.05.2016 */
const _ = require("underscore");
const ast = rerequire("./ir/ast.js");
const def = rerequire("./ir/def.js");
const should = require("should");
const Promise = require("bluebird");

function Block() {
    this.imports = [];
    this.stmts = [];
    this.objects = {};
    this.name = null;
    this.blocks = [];
    this.exported = false;
    this.infix = false;

    this.hasImport = function (alias) {
        if (_.isEmpty(alias))
            return false;
        
        var ok = false;
        this.imports.forEach(function (i) {
            if (_.isEqual(i.alias, alias) || (_.isEmpty(i.alias) && _.isEqual(i.name, alias))){
                ok = true;
            }
        });
        return ok;
    };
    
    this.isModule = false;
}

function Target(name, sc) {
    const t = this;
    this.mod = ast.mod();
    this.mod.name = name;
    this._bstack = [];
    this._resolvers = [];

    t.std = function () {
        var std = ast.imp();
        std.name = "$std";
        std.alias = "";
        std.def = def.std();
        return std;
    };
    
    t.isMod = function (id) {
        var ok = false;
        t.mod.imports.forEach(function (i) {
            if (_.isEqual(i.alias, id) || (_.isEmpty(i.alias) && _.isEqual(i.name, id))){
                ok = true;
            }
        });
        return ok;
    };

    t.isObj = function (mod, name) {
        if(_.isEqual(mod, t.mod.name)){
            if(t.block().isModule) {
                return t.block().objects.hasOwnProperty(name);
            } else {
                var local = t.block().objects.hasOwnProperty(name);
                return local || t.mod.objects.hasOwnProperty(name);
            }
        } else {
            var imp = t.mod.thisImport(mod);
            return !_.isNull(imp.thisObj(name));
        }
    };

    t.thisObj = function(sel){
        var ret = null;
        if(_.isEqual(sel.module, t.mod.name)){
            if(t.block().isModule) {
                ret = t.mod.objects[sel.name];
            } else {
                var local = t.block().objects.hasOwnProperty(sel.name);
                ret = local ?  t.block().objects[sel.name] : t.mod.objects[sel.name];
            }
        } else {
            var imp = t.mod.thisImport(sel.module);
            ret = imp.thisObj(sel.name);
        }
        should.exist(ret);
        return ret;
    };

    t.isBlock = function (mod, name) {
        if(_.isEqual(mod, t.mod.name)){
            var ret = false;
            t.mod.blocks.forEach(function (b) {
                if (_.isEqual(b.name, name)){
                    ret = true;
                }
            });
            return ret;
        } else {
            var imp = t.mod.thisImport(mod);
            return !_.isNull(imp.thisBlock(name));
        }
    };
    
    this.pushBlock = function () {
        var ret = new Block();
        this._bstack.push(ret);
        return ret;
    };

    this.popBlock = function () {
        return this._bstack.pop();
    };

    this.block = function () {
        return _.last(this._bstack);
    };

    this.result = function () {
        return this.mod
    };

    t.compatibleTypes = function (tgt, src) {
        console.log("compatibility test ", tgt, src);
        var ret = false;
        function sel4const() {
            should.ok(_.isEmpty(tgt.inside));
            var o = t.thisObj(tgt);
            switch (o.type.name){
                case "ANY":
                    ret = true;
                    break;
                case "INTEGER":
                case "BOOLEAN":
                case "STRING":
                case "CHAR":
                case "BLOCK":
                    ret = _.isEqual(o.type.name, src.type.name);
                    if (!ret && _.isEqual(o.type.name, "BLOCK")){
                        ret = _.isEqual(src.type.name, "ANY")
                    }
                    break;
                case "LIST":
                case "MAP":
                    ret = true; //TODO добавить проверку
                    break;
                default: throw new Error(`unsupported type check ${o.type.name}`);
            }
        }

        function sel4sel() {
            var o = t.thisObj(tgt);
            var p = t.thisObj(src.selector);
            switch (o.type.name){
                case "ANY":
                    ret = true;
                    break;
                case "INTEGER":
                case "BOOLEAN":
                case "CHAR":
                    if (ast.is(p).type("Constant")) {
                        ret = true; //TODO fix this
                        return;
                    }
                    ret = _.isEqual(o.type.name, p.type.name);
                    if(!ret &&  !_.isEmpty(src.selector.inside)){
                        if (_.isEqual(p.type.name, "ANY")){
                            var deref = _.last(src.selector.inside);
                            ret = !_.isUndefined(deref) && ast.is(deref).type("DerefExpr");
                        } else if (_.isEqual(p.type.name, "LIST")) {
                            var deref = _.last(src.selector.inside);
                            ret = !_.isUndefined(deref) && ast.is(deref).type("DerefExpr");
                        } else if (_.isEqual(o.type.name, "CHAR") && _.isEqual(p.type.name, "STRING")){
                            var index = _.last(src.selector.inside);
                            ret = !_.isUndefined(index);
                        }
                    }
                    break;
                case "STRING":
                case "MAP":
                case "LIST":
                case "BLOCK":
                    ret = true; //TODO fix type check
                    break;
                default: throw new Error(`unsupported type check ${o.type.name}`)
            }
        }

        if (ast.is(tgt).type("Selector")){
            if(ast.is(src).type("ConstExpr")) {
                sel4const();
            } else if(ast.is(src).type("SelectExpr")) {
                sel4sel();
            } else if(ast.is(src).type("DyadicOp")) {
                ret = true; //TODO fix op type check
            } else if (ast.is(src).type("MonadicOp")) {
                ret = true;
            } else if (ast.is(src).type("InfixExpr")) {
                ret = true;
            } else {
                throw new Error(`incompatible source ${src.constructor.name}`);
            }
        } else {
            throw new Error(`incompatible target ${tgt.constructor.name}`);
        }
        return ret;
    }
}

module.exports = function (name, sc) {
    return new Target(name, sc);
};