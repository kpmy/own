/**
 * Created by petry_000 on 19.05.2016.
 */
const should = require("should");
const types = rerequire("../ir/types.js")();

function Type(tn) {
    const t = this;
    
    t.type = types.find(tn);
    should.exist(t.type);
}
Type.prototype.type = null;

function Obj(t) {
    const o = this;
    
    o.type = t;
}
Obj.prototype.type = null;
Obj.prototype.value = null;

function Value(tn, val) {
    const v = this;
    
    v.type = types.find(tn);
    should.exist(v.type);
    v.value = v.type.parse(val);
}

Value.prototype.type = null;
Value.prototype.value = null;

module.exports.Type = Type;
module.exports.Obj = Obj;
module.exports.Value = Value;