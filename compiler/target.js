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
            if (_.isEqual(i.alias, alias)){
                ok = true;
            }
        });
        return ok;
    }
}

function Target(name) {
    this.mod = ast.mod();
    this.mod.name = name;
    this._bstack = [];

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