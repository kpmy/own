/**
 * Created by petry_000 on 12.05.2016.
 */
const _ = require('underscore');
const should = require('should');

const types = rerequire("./types.js");

function Selector() {
    
}
Selector.prototype.module = null;
Selector.prototype.name = null;
Selector.prototype.inside = [];

function Variable() {
    
}
Variable.prototype.name = null;
Variable.prototype.type = null;

function Module() {

}
Module.prototype.name = null;
Module.prototype.imports = [];
Module.prototype.objects = {};
Module.prototype.start = [];
Module.prototype.stop = [];

function Definition() {
    
}
Definition.prototype.name = null;

function Import() {
    
}
Import.prototype.name = null;
Import.prototype.alias = null;
Import.prototype.def = null;
Import.prototype.imports = [];

function ConstExpr() {
    this.setValue = function (v) {
        should.exist(this.type);
        this.value = this.type.parse(v);
    }
}
ConstExpr.prototype.type = null;
ConstExpr.prototype.value = null;

function Expr() {
    this.constant = function (type, value) {
        var ret = new ConstExpr();
        ret.type = type;
        ret.value = value;
        return ret;
    }
}

function Assign() {
    
}
Assign.prototype.expression = null;
Assign.prototype.selector = null;

function Stmt() {
    this.assign = function () {
        return new Assign();
    }
}

module.exports.mod = function () {
    return new Module();
};

module.exports.def = function () {
    return new Definition();
};

module.exports.imp = function () {
    return new Import();
};

module.exports.expr = function () {
    return new Expr();
};

module.exports.stmt = function () {
    return new Stmt();
};

module.exports.variable = function () {
    return new Variable();
};

module.exports.selector = function () {
    return new Selector();
};

module.exports.is = function (o) {
    return {
        type: function (t) {
            return _.isEqual(o.constructor.name, t);
        }
    }
};

module.exports.isStatement = function (x) {
    return (x instanceof Assign);
};