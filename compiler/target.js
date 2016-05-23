/**
 * Created by petry_000 on 12.05.2016.
 */
const _ = require("underscore");
const ast = rerequire("./ir/ast.js");
const Promise = require("bluebird");

function Block() {
    this.imports = [];
    this.stmts = [];
    this.objects = {};
    this.name = null;
    this.blocks = [];

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
                return t.mod.objects.hasOwnProperty(name);
            } else {
                var local = t.block().objects.hasOwnProperty(name);
                return local || t.mod.objects.hasOwnProperty(name);
            }
        } else {
            return !_.isEqual(name, "Do"); //TODO fix this crap
        }
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
            return _.isEqual(name, "Do");
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
    }
}

module.exports = function (name, sc) {
    return new Target(name, sc);
};