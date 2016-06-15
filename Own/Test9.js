function UnitTest9 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$bool = new rts.Const((new rts.Value("BOOLEAN", false)));
mod.$int = new rts.Const((new rts.Value("INTEGER", 53)));
mod.$int2 = new rts.Const((rts.math.dop(function(){return (rts.copyOf(mod.$int.value()))}, "+", function(){return (new rts.Value("INTEGER", 434))})));
mod.$int1 = new rts.Obj(new rts.Type("INTEGER"));
mod.start = function(){
console.log('dynamic load Test9'); 
mod.$int1.value((rts.copyOf(mod.$int2.value())));
mod.$int1.value((rts.math.dop(function(){return (rts.copyOf(mod.$int1.value()))}, "+", function(){return (rts.copyOf(mod.$int.value()))})));
};
};
module.exports = function(rts){return new UnitTest9 (rts)};