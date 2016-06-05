/* Created by kpmy on 12.05.2016 */
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
    this.modifier = "";
}

function Module() {
    this.name = null;
    this.imports = [];
    this.objects = {};
    this.start = [];
    this.stop = [];
    this.blocks = [];
    
    this.thisBlock = function (name) {
        console.log(`find block ${name}`);
        var ret = null;
        ret = this.blocks.find(x => _.isEqual(x.name, name));
        return _.isUndefined(ret) ? null : ret;
    };
    
    this.thisImport = function (name) {
        console.log(`find imp ${name}`);
        var ret = null;
        ret = this.imports.find(x => _.isEqual(x.name, name));
        return _.isUndefined(ret) ? null : ret;
    }
}

function Block() {
    this.name = null;
    this.sequence = [];
    this.objects = {};
    this.exported = false;
}

function Definition() {
    this.name = null;
    this.imports = [];
    this.objects = {};
    this.blocks = [];
}

function Import() {
    this.name = null;
    this.alias = null;
    this.def = null;

    this.thisBlock = function (name) {
        console.log(`find imp block ${name}`);
        console.dir(this);
        var ret = null;
        ret = this.def.blocks.find(x => _.isEqual(x.name, name));
        return _.isUndefined(ret) ? null : ret;
    };

    this.thisObj = function(name){
        console.log(`find imp obj ${name}`);
        console.dir(this);
        var ret = null;
        ret = this.def.objects.hasOwnProperty(name) ? this.def.objects[name] : null;
        return _.isUndefined(ret) ? null : ret;
    }
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
    this.type = "value";
    this.number = null;
}

function CallExpr() {
    this.name = null;
    this.module = null;
    this.block = null;
    this.params = [];

    //transient
    this.pure = true;
    
    this.param = function (e) {
        return new Param(e);
    }
}

function SelectExpr() {
    this.selector = null;
}

function DerefExpr() {

}

function DotExpr() {

}

function DyadicOp() {
    this.left = null;
    this.right = null;
    this.op = null;
}

function MonadicOp() {
    this.op = null;
    this.expr = null;
}

function Expr() {
    this.constant = function (type, value) {
        var ret = new ConstExpr();
        ret.type = type;
        ret.value = value;
        return ret;
    };

    this.call = function (module, name, block) {
        var ret = new CallExpr();
        ret.module = module;
        ret.name = name;
        if(!_.isUndefined(block)) ret.block = block;
        return ret;
    };
    
    this.select = function (sel) {
        var ret = new SelectExpr();
        ret.selector = sel;
        return ret;
    };

    this.deref = function () {
        return new DerefExpr();
    };

    this.dot = function () {
        return new DotExpr();
    };

    this.dyadic = function (op) {
        var ret = new DyadicOp();
        ret.op = op;
        return ret;
    };
    
    this.monadic = function (op) {
        var ret = new MonadicOp();
        ret.op = op;
        return ret;
    }
}

function Assign() {
    this.expression = null;
    this.selector = null;
}

function Call() {
    this.expression = null;
    this.selector = null;
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
    return (x instanceof CallExpr) || (x instanceof SelectExpr) || (x instanceof ConstExpr) || (x instanceof DerefExpr) || (x instanceof DotExpr) || (x instanceof DyadicOp) || (x instanceof MonadicOp);
};