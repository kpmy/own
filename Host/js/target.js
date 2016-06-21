/* Created by kpmy on 12.05.2016 */
const _ = require("underscore");
const should = require("should");

const ast = rerequire("./ir/ast.js");
const def = rerequire("./ir/def.js");
const owl2 = rerequire("./owl2");

function Block() {
    this.imports = [];
    this.stmts = [];
    this.objects = {};
    this.name = null;
    this.blocks = [];
    this.exported = false;
    this.infix = false;
    this.pre = [];
    this.post = [];

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
        return true;
    };

    t.registerType = function (t) {
        should.exist(t.value);
        owl2.build(t.value);
    }
}

module.exports = function (name, sc) {
    return new Target(name, sc);
};