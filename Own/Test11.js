function UnitTest11 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$hi = new rts.Const((new rts.Value("STRING", `SGk=`, "base64")));
mod.$WEIGHT = new rts.Const((new rts.Value("TYPE", function(){var t = new tpl.Leaf();
t.qid = new tpl.Qualident(undefined, "TYPE", undefined);
t.clazz = new tpl.Clazz(undefined, "TYPE");
    t.unique = true;
t.push(function(){var t = new tpl.Leaf();
    t.qid = new tpl.Qualident(undefined, "SubClassOf", undefined);
    t.clazz = new tpl.Clazz(undefined, "SubClassOf");
t.unique = false;
t.push(function(){var t = new tpl.Leaf();
t.qid = new tpl.Qualident(undefined, "INTEGER", undefined);
t.clazz = new tpl.Clazz(undefined, "INTEGER");
t.unique = false;
return t}());
return t}());
return t}())));
mod.$w = new rts.Obj(new rts.Type("USER", "WEIGHT", mod.$WEIGHT.value()));
mod.$x = new rts.Obj(new rts.Type("INTEGER"));

mod.$Do = function(){
if(rts.getNative("boolean", (rts.math.dop(function(){return (rts.copyOf(mod.$x.value()))}, ">", function(){return (new rts.Value("INTEGER", 0))})))){
mod.$x.value((new rts.Value("INTEGER", 0)));
} else if(rts.getNative("boolean", (rts.math.dop(function(){return (rts.copyOf(mod.$x.value()))}, "=", function(){return (new rts.Value("INTEGER", 0))})))){
mod.$x.value((rts.math.mop("-", function(){return (new rts.Value("INTEGER", 1))})));
}else {
mod.$x.value((new rts.Value("INTEGER", 10)));
}
};

mod.$Do0 = function(){
var $i = new rts.Obj(new rts.Type("INTEGER"));
for (var cond1 = true; cond1; ){
if(rts.getNative("boolean", (rts.math.dop(function(){return (rts.copyOf($i.value()))}, "<", function(){return (new rts.Value("INTEGER", 10))})))){
(mod.Import$std.$INC($i));
} else if(rts.getNative("boolean", (rts.math.dop(function(){return (rts.copyOf($i.value()))}, "<", function(){return (new rts.Value("INTEGER", 20))})))){
$i.value((rts.math.dop(function(){return (rts.copyOf($i.value()))}, "+", function(){return (new rts.Value("INTEGER", 2))})));
} else {
    cond1 = false;
}
}
    mod.$x.value((rts.copyOf($i.value())));
};

mod.$Do1 = function(){
var $i = new rts.Obj(new rts.Type("INTEGER"));
$i.value((rts.copyOf(mod.$x.value())));
for (var cond2 = false; !cond2; ){
(mod.Import$std.$INC($i));
    cond2 = rts.getNative("boolean", (rts.math.dop(function () {
        return (rts.copyOf($i.value()))
    }, ">=", function () {
        return (new rts.Value("INTEGER", 30))
    })))
}
    mod.$x.value((rts.copyOf($i.value())));
};
mod.start = function(){
mod.$w.value((new rts.Value("INTEGER", 10)));
mod.$x.value((new rts.Value("INTEGER", 10)));
(mod.$Do());
(mod.$Do());
(mod.$Do());
(mod.$Do0());
(mod.$Do1());
};
}
module.exports = function(rts){return new UnitTest11 (rts)};