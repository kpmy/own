function UnitTest2 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.Import$std = rts.load("$std");
mod.$bool = new rts.Obj(new rts.Type("BOOLEAN"));
mod.$int = new rts.Obj(new rts.Type("INTEGER"));
mod.$any = new rts.Obj(new rts.Type("ANY"));
mod.$a0 = new rts.Obj(new rts.Type("ANY"));
mod.$a1 = new rts.Obj(new rts.Type("ANY"));
mod.$str = new rts.Obj(new rts.Type("STRING"));
mod.$ch = new rts.Obj(new rts.Type("CHAR"));
mod.$ch0 = new rts.Obj(new rts.Type("CHAR"));
mod.$map = new rts.Obj(new rts.Type("MAP"));
mod.$map0 = new rts.Obj(new rts.Type("MAP"));
mod.$list = new rts.Obj(new rts.Type("LIST"));
mod.$proc = new rts.Obj(new rts.Type("BLOCK"));
mod.$call = new rts.Obj(new rts.Type("BLOCK"));
mod.$callList = new rts.Obj(new rts.Type("LIST"));

mod.$Do0 = function(){
var $x = new rts.Obj(new rts.Type("INTEGER"));
if(arguments[0] !== undefined){
if(!rts.isValue(arguments[0])){
$x = arguments[0];
} else {
$x.value(arguments[0]);
}
}

$x.value((new rts.Value("INTEGER", 1933)));
};
mod.start = function(){
mod.$bool.value((new rts.Value("BOOLEAN", true)));
mod.$int.value((new rts.Value("INTEGER", 140)));
mod.$any.value((rts.copyOf(mod.$int.value())));
mod.$str.value((new rts.Value("STRING", `SGVsbG8sIFdvcmxkIQ==`, "base64")));
mod.$ch.value((new rts.Value("CHAR", 33, "charCode")));
mod.$map.value((new rts.Value("MAP", [[(new rts.Value("STRING", `aGVsbG8=`, "base64")),	(new rts.Value("STRING", `d29ybGQ=`, "base64"))],
[(new rts.Value("STRING", `aGk=`, "base64")),	(new rts.Value("INTEGER", 1))],
[(new rts.Value("STRING", `Ynll`, "base64")),	(rts.copyOf(mod.$int.value()))]])));
mod.$list.value((new rts.Value("LIST", [(new rts.Value("STRING", `aGVsbG8=`, "base64")),
(new rts.Value("STRING", `d29ybGQ=`, "base64")),
(new rts.Value("STRING", `aGk=`, "base64")),
(new rts.Value("INTEGER", 1)),
(new rts.Value("STRING", `Ynll`, "base64")),
(rts.copyOf(mod.$int.value()))])));
mod.$ch0.value((rts.copyOf(mod.$str.select((new rts.Value("INTEGER", 0))).value())));
mod.$str.select((new rts.Value("INTEGER", 0))).value((rts.copyOf(mod.$str.select((new rts.Value("INTEGER", 1))).value())));
mod.$a0.value((rts.copyOf(mod.$list.select((new rts.Value("INTEGER", 4))).value())));
mod.$list.select((new rts.Value("INTEGER", 0))).value((rts.copyOf(mod.$a0.value())));
mod.$a1.value((rts.copyOf(mod.$map.select((new rts.Value("STRING", `aGk=`, "base64"))).value())));
mod.$map.select((new rts.Value("STRING", `Ynll`, "base64"))).value((rts.copyOf(mod.$int.value())));
mod.$map0.value((new rts.Value("MAP", [[(new rts.Value("STRING", `bGlzdA==`, "base64")),	(new rts.Value("LIST", [(new rts.Value("INTEGER", 0)),
(new rts.Value("INTEGER", 1)),
(new rts.Value("INTEGER", 2)),
(new rts.Value("INTEGER", 3))]))]])));
mod.$proc.value((new rts.Value("BLOCK", mod.$Do0)));
mod.$proc.call();
mod.$call.value((rts.copyOf(mod.$proc.value())));
mod.$call.call(mod.$int,
(new rts.Value("INTEGER", 2)),
(new rts.Value("INTEGER", 3)));
mod.$proc.call();
mod.$callList.value((new rts.Value("LIST", [(rts.copyOf(mod.$proc.value())),
(rts.copyOf(mod.$call.value())),
(new rts.Value("BLOCK", mod.$Do0))])));
mod.$proc.value((new rts.Value("ANY", global.NONE)));
};
}
module.exports = function(rts){return new UnitTest2 (rts)};