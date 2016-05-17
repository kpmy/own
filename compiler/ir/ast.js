/**
 * Created by petry_000 on 12.05.2016.
 */

function Module() {

}
Module.prototype.name = null;
Module.prototype.imports = [];
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