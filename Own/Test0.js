function UnitTest0 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.ImportLog = rts.load("Log");
mod.Import$std = rts.load("$std");
mod.$i = new rts.Obj(new rts.Type("INTEGER"));
mod.$j = new rts.Obj(new rts.Type("INTEGER"));

mod.$Do = function(){
console.log("enter Test0.Do");
console.dir(arguments, {depth: null});
mod.$j.value((new rts.Value("INTEGER", 1)));
console.log("leave Test0.Do");
};

mod.$Do0 = function(){
console.log("enter Test0.Do0");
console.dir(arguments, {depth: null});
var $i = new rts.Obj(new rts.Type("INTEGER"));
if(arguments[0] !== undefined){
if(!rts.isValue(arguments[0])){
$i = arguments[0];
} else {
$i.value(arguments[0]);
}
}

$i.value((new rts.Value("INTEGER", 3423)));
console.log("leave Test0.Do0");
};
mod.start = function(){
console.log('dynamic load Test0'); 
};
};
module.exports = function(rts){return new UnitTest0 (rts)};