function UnitTest4 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$x = new rts.Obj(new rts.Type("INTEGER"));
mod.$y = new rts.Obj(new rts.Type("INTEGER"));
mod.$z = new rts.Obj(new rts.Type("INTEGER"));

mod.$Do = function(){
var $i = new rts.Obj(new rts.Type("INTEGER"));
$i.value(arguments[0]);
mod.$y.value((rts.copyOf($i.value())));
};

mod.$Hidden = function(){
};
mod.start = function(){
mod.$x.value((new rts.Value("INTEGER", 10)));
mod.$z.value((new rts.Value("INTEGER", 14)));
};
}
module.exports = function(rts){return new UnitTest4 (rts)};