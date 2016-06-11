/* Created by kpmy on 12.05.2016 */
const _ = require('underscore');
const should = require('should');

const types = rerequire("./types.js")();

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

function Constant() {
    this.name = null;
    this.expression = null;
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
        var ret = null;
        ret = this.blocks.find(x => _.isEqual(x.name, name));
        return _.isUndefined(ret) ? null : ret;
    };
    
    this.thisImport = function (name) {
        var ret = null;
        ret = this.imports.find(x => _.isEmpty(x.alias) ? _.isEqual(x.name, name) : _.isEqual(x.alias, name));
        return _.isUndefined(ret) ? null : ret;
    };

    this.thisType = function (id) {
        var ret = null;
        var c = this.objects[id];
        if (is(c).type("Constant")) {
            console.dir(c, {depth: null});
            if (_.isEqual(c.expression.type.name, "TYPE")) {
                ret = types.userType(id);
                ret.value = c.value;
            } else {
                throw new Error("0");
            }
        } else {
            throw new Error("1")
        }
        return ret;
    }
}

function Block() {
    this.name = null;
    this.sequence = [];
    this.objects = {};
    this.exported = false;
    this.infix = false;
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
        var ret = null;
        ret = this.def.blocks.find(x => _.isEqual(x.name, name));
        return _.isUndefined(ret) ? null : ret;
    };

    this.thisObj = function(name){
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
    this.fix = function () {
    };
    
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

function InfixExpr() {
    this.selector = null;
    this.expression = null;
    this.arity = 0;
    this.params = [];
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
    };

    this.infix = function () {
        return new InfixExpr();
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

module.exports.constant = function () {
    return new Constant();
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

let is = function (o) {
    return {
        type: function (t) {
            return _.isEqual(o.constructor.name, t);
        }
    }
};

module.exports.is = is;

module.exports.isStatement = function (x) {
    return (x instanceof Assign) || (x instanceof Call);
};

module.exports.isExpression = function (x) {
    return (x instanceof CallExpr) || (x instanceof SelectExpr) || (x instanceof ConstExpr)
        || (x instanceof DerefExpr) || (x instanceof DotExpr) || (x instanceof DyadicOp) || (x instanceof MonadicOp)
        || (x instanceof InfixExpr);
};