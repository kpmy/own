function UnitTest8 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.ImportConsole = rts.load("Console");
mod.ImportLog = mod.ImportConsole;
mod.Import$std = rts.load("$std");
mod.$s = new rts.Obj(new rts.Type("STRING"));
mod.$b = new rts.Obj(new rts.Type("BOOLEAN"));
mod.$x = new rts.Obj(new rts.Type("INTEGER"));
mod.$ch = new rts.Obj(new rts.Type("INTEGER"));
mod.$inf = new rts.Obj(new rts.Type("BLOCK"));

mod.$Wo = function(){
console.log("enter Test8.Wo");
console.dir(arguments, {depth: null});
var $x = new rts.Obj(new rts.Type("INTEGER"));
var $f = new rts.Obj(new rts.Type("INTEGER"));
if(arguments[0] !== undefined){
if(!rts.isValue(arguments[0])){
$f = arguments[0];
} else {
$f.value(arguments[0]);
}
}

$x.value(arguments[1]);
$f.value((rts.copyOf($x.value())));
console.log("leave Test8.Wo");
};

mod.$Wo2 = function(){
console.log("enter Test8.Wo2");
console.dir(arguments, {depth: null});
var $x = new rts.Obj(new rts.Type("INTEGER"));
var $y = new rts.Obj(new rts.Type("INTEGER"));
var $z = new rts.Obj(new rts.Type("INTEGER"));
var $f = new rts.Obj(new rts.Type("INTEGER"));
$x.value(arguments[0]);
if(arguments[1] !== undefined){
if(!rts.isValue(arguments[1])){
$f = arguments[1];
} else {
$f.value(arguments[1]);
}
}

$y.value(arguments[2]);
$z.value(arguments[3]);
$f.value((rts.math.dop(function(){return (rts.math.dop(function(){return (rts.copyOf($x.value()))}, "+", function(){return (rts.copyOf($y.value()))}))}, "+", function(){return (rts.copyOf($z.value()))})));
console.log("leave Test8.Wo2");
};
mod.start = function(){
console.log('dynamic load Test8'); 
mod.$s.value((new rts.Value("STRING", `SGVsbG8=`, "base64")));
mod.$s.value((rts.math.dop(function(){return (rts.math.dop(function(){return (rts.copyOf(mod.$s.value()))}, "+", function(){return (new rts.Value("CHAR", 44, "charCode"))}))}, "+", function(){return (new rts.Value("CHAR", 32, "charCode"))})));
(mod.ImportLog.$Print((rts.math.dop(function(){return (rts.math.dop(function(){return (rts.copyOf(mod.$s.value()))}, "+", function(){return (new rts.Value("STRING", `V29ybGQ=`, "base64"))}))}, "+", function(){return (rts.math.dop(function(){return (new rts.Value("CHAR", 33, "charCode"))}, "+", function(){return (new rts.Value("CHAR", 13, "charCode"))}))}))));
mod.$b.value((rts.math.dop(function(){return (rts.math.dop(function(){return (new rts.Value("STRING", `SGVsbG8=`, "base64"))}, "#", function(){return (new rts.Value("STRING", `V29sZA==`, "base64"))}))}, "&", function(){return (rts.math.dop(function(){return (new rts.Value("STRING", `V29ybGQ=`, "base64"))}, "=", function(){return (new rts.Value("STRING", `SGVsbG8=`, "base64"))}))})));
mod.$b.value((rts.math.dop(function(){return (rts.math.dop(function(){return (new rts.Value("CHAR", 33, "charCode"))}, "=", function(){return (new rts.Value("CHAR", 33, "charCode"))}))}, "&", function(){return (rts.math.dop(function(){return (new rts.Value("CHAR", 52, "charCode"))}, "<", function(){return (new rts.Value("CHAR", 53, "charCode"))}))})));
mod.$x.value((function(){ var tmp1 = new rts.Obj(new rts.Type("INTEGER"));
(mod.$Wo(tmp1,
(new rts.Value("INTEGER", 5))));
return tmp1.value();}()));
mod.$x.value((function(){ var tmp2 = new rts.Obj(new rts.Type("INTEGER"));
(mod.$Wo2((new rts.Value("INTEGER", 4)),
tmp2,
(new rts.Value("INTEGER", 5)),
(new rts.Value("INTEGER", 5))));
return tmp2.value();}()));
mod.$inf.value((new rts.Value("BLOCK", mod.$Wo)));
mod.$x.value((function(){ var tmp3 = new rts.Obj(new rts.Type("ANY"));
mod.$inf.call(tmp3,
(new rts.Value("INTEGER", 5)));
return tmp3.deref().value();}()));
mod.$ch.value((function(){ var tmp4 = new rts.Obj(new rts.Type("INTEGER"));
(mod.Import$std.$ORD(tmp4,
(new rts.Value("CHAR", 120, "charCode"))));
return tmp4.value();}()));
};
};
module.exports = function(rts){return new UnitTest8 (rts)};