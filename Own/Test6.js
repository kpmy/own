function UnitTest6 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$i = new rts.Obj(new rts.Type("INTEGER"));
mod.$j = new rts.Obj(new rts.Type("INTEGER"));
mod.$k = new rts.Obj(new rts.Type("INTEGER"));
mod.$p = new rts.Obj(new rts.Type("BOOLEAN"));
mod.$q = new rts.Obj(new rts.Type("BOOLEAN"));
mod.$r = new rts.Obj(new rts.Type("BOOLEAN"));
mod.start = function(){
mod.$i.value((new rts.Value("INTEGER", 1)));
mod.$j.value((new rts.Value("INTEGER", 2)));
mod.$k.value((rts.math.dop(function(){return (rts.math.dop(function(){return (rts.copyOf(mod.$i.value()))}, "+", function(){return (rts.copyOf(mod.$j.value()))}))}, "+", function(){return (new rts.Value("INTEGER", 5))})));
mod.$j.value((rts.math.mop("-", function(){return (rts.copyOf(mod.$i.value()))})));
mod.$i.value((rts.math.dop(function(){return (new rts.Value("INTEGER", 2))}, "+", function(){return (rts.math.dop(function(){return (new rts.Value("INTEGER", 2))}, "*", function(){return (new rts.Value("INTEGER", 2))}))})));
mod.$k.value((rts.math.dop(function(){return (rts.math.dop(function(){return (new rts.Value("INTEGER", 2))}, "+", function(){return (new rts.Value("INTEGER", 2))}))}, "*", function(){return (new rts.Value("INTEGER", 2))})));
mod.$p.value((rts.math.dop(function(){return (new rts.Value("BOOLEAN", false))}, "|", function(){return (new rts.Value("BOOLEAN", true))})));
mod.$q.value((rts.math.dop(function(){return (new rts.Value("BOOLEAN", false))}, "&", function(){return (new rts.Value("BOOLEAN", true))})));
mod.$r.value((rts.math.dop(function(){return (rts.math.mop("~", function(){return (rts.copyOf(mod.$q.value()))}))}, "&", function(){return (rts.copyOf(mod.$p.value()))})));
mod.$p.value((rts.math.dop(function(){return (new rts.Value("INTEGER", 1))}, "=", function(){return (new rts.Value("INTEGER", 1))})));
mod.$q.value((rts.math.dop(function(){return (new rts.Value("INTEGER", 1))}, "#", function(){return (new rts.Value("INTEGER", 1))})));
mod.$r.value((rts.math.dop(function(){return (rts.math.dop(function(){return (new rts.Value("INTEGER", 1))}, ">", function(){return (new rts.Value("INTEGER", 2))}))}, "|", function(){return (rts.math.dop(function(){return (new rts.Value("INTEGER", 2))}, "<", function(){return (new rts.Value("INTEGER", 3))}))})));
mod.$r.value((rts.math.dop(function(){return (rts.math.dop(function(){return (new rts.Value("INTEGER", 1))}, ">=", function(){return (new rts.Value("INTEGER", 2))}))}, "|", function(){return (rts.math.dop(function(){return (new rts.Value("INTEGER", 2))}, "<=", function(){return (new rts.Value("INTEGER", 3))}))})));
};
}
module.exports = function(rts){return new UnitTest6 (rts)};