/**
 * Created by petry_000 on 12.05.2016.
 */
const _ = require("underscore");
const ast = rerequire("./ir/ast.js");

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

function Target(name) {
    this.mod = ast.mod();
    this.mod.name = name;
    this._bstack = [];

    this.isMod = function (id) {
        var ok = false;
        this.mod.imports.forEach(function (i) {
            if (_.isEqual(i.alias, id) || (_.isEmpty(i.alias) && _.isEqual(i.name, id))){
                ok = true;
            }
        });
        return ok;
    };

    this.isObj = function (mod, name) {
        if(_.isEqual(mod, this.mod.name)){
            if(this.block().isModule) {
                return this.mod.objects.hasOwnProperty(name);
            } else {
                var local = this.block().objects.hasOwnProperty(name);
                return local || this.mod.objects.hasOwnProperty(name);
            }
        } else {
            return !_.isEqual(name, "Do"); //TODO fix this crap
        }
    };
    
    this.isBlock = function (mod, name) {
        if(_.isEqual(mod, this.mod.name)){
            var ret = false;
            this.mod.blocks.forEach(function (b) {
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

module.exports = function (name) {
    return new Target(name);
};