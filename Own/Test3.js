function UnitTest (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$i = new rts.Obj(new rts.Type("INTEGER"));
mod.$j = new rts.Obj(new rts.Type("INTEGER"));
mod.$p = new rts.Obj(new rts.Type("BOOLEAN"));
mod.$q = new rts.Obj(new rts.Type("BOOLEAN"));
mod.$x = new rts.Obj(new rts.Type("ANY"));
mod.$list = new rts.Obj(new rts.Type("LIST"));

mod.$Init = function(){
mod.$i.value((new rts.Value("INTEGER", 32)));
mod.$j.value((new rts.Value("INTEGER", 232)));
mod.$j.value((rts.copyOf(mod.$i.value())));
mod.$p.value((new rts.Value("BOOLEAN", true)));
mod.$q.value((new rts.Value("BOOLEAN", false)));
mod.$q.value((rts.copyOf(mod.$p.value())));
mod.$x.value((rts.copyOf(mod.$i.value())));
mod.$x.value((new rts.Value("INTEGER", 400)));
mod.$i.value((rts.copyOf(mod.$x.deref().value())));
mod.$x.value((new rts.Value("BOOLEAN", true)));
mod.$x.value((new rts.Value("ANY", global.NONE)));
mod.$list.value((new rts.Value("LIST", [(new rts.Value("INTEGER", 1)),
(new rts.Value("INTEGER", 2)),
(new rts.Value("INTEGER", 3))])));
mod.$j.value((rts.copyOf(mod.$list.select((new rts.Value("INTEGER", 0))).deref().value())));
mod.$list.value((new rts.Value("LIST", [(new rts.Value("LIST", [(new rts.Value("INTEGER", 1)),
(new rts.Value("INTEGER", 2)),
(new rts.Value("INTEGER", 3))])),
(new rts.Value("LIST", [(new rts.Value("INTEGER", 4)),
(new rts.Value("INTEGER", 5)),
(new rts.Value("INTEGER", 6))]))])));
    mod.$j.value((rts.copyOf(mod.$list.select((new rts.Value("INTEGER", 1))).deref().select((new rts.Value("ATOM", "null"))).select((new rts.Value("INTEGER", 2))).deref().value())));
};
mod.start = function(){
(mod.$Init());
};
}
module.exports = function(rts){return new UnitTest (rts)};