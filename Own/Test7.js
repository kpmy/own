function UnitTest7 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$i = new rts.Obj(new rts.Type("INTEGER"));
mod.$proc = new rts.Obj(new rts.Type("BLOCK"));
mod.start = function(){
(mod.Import$std.$INC(mod.$i));
(mod.Import$std.$INC(mod.$i));
(mod.Import$std.$INC(mod.$i));
(mod.Import$std.$DEC(mod.$i));
mod.$proc.value((new rts.Value("BLOCK", mod.Import$std.$INC)));
mod.$proc.call(mod.$i);
};
}
module.exports = function(rts){return new UnitTest7 (rts)};