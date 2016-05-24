/**
 * Created by petry_000 on 12.05.2016.
 */
const _ = require('underscore');
const should = require('should');

const types = rerequire("./types.js");

function Selector() {
    this.module = null;
    this.block = null;
    this.name = null;
    this.inside = [];
}

function Variable() {
    this.name = null;
    this.type = null;
}

function Module() {
    this.name = null;
    this.imports = [];
    this.objects = {};
    this.start = [];
    this.stop = [];
    this.blocks = [];
}

function Block() {
    this.name = null;
    this.sequence = [];
    this.objects = [];
}

function Definition() {
    this.name = null;
}

function Import() {
    this.name = null;
    this.alias = null;
    this.def = null;
    this.imports = [];
}

function ConstExpr() {
    this.type = null;
    this.value = null;
    
    this.setValue = function (v) {
        should.exist(this.type);
        this.value = this.type.parse(v);
    }
}

function Param(e) {
    this.expression = e;
}

function FormalParam() {
    
}

function CallExpr() {
    this.name = null;
    this.module = null;
    this.params = [];
    
    this.param = function (e) {
        return new Param(e);
    }
}

function SelectExpr() {
    this.selector = null;
}

function Expr() {
    this.constant = function (type, value) {
        var ret = new ConstExpr();
        ret.type = type;
        ret.value = value;
        return ret;
    };

    this.call = function (module, name) {
        var ret = new CallExpr();
        ret.module = module;
        ret.name = name;
        return ret;
    };
    
    this.select = function (sel) {
        var ret = new SelectExpr();
        ret.selector = sel;
        return ret;
    }
}

function Assign() {
    this.expression = null;
    this.selector = null;
}

function Call() {
    this.expression = null;
}

function Stmt() {
    this.assign = function () {
        return new Assign();
    };

    this.call = function () {
        return new Call();
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

module.exports.block = function () {
    return new Block();
};

module.exports.formal = function () {
    return new FormalParam();
};

module.exports.is = function (o) {
    return {
        type: function (t) {
            return _.isEqual(o.constructor.name, t);
        }
    }
};

module.exports.isStatement = function (x) {
    return (x instanceof Assign) || (x instanceof Call);
};

module.exports.isExpression = function (x) {
    return (x instanceof CallExpr) || (x instanceof SelectExpr) || (x instanceof ConstExpr);
};