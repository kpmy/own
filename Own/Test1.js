function UnitTest1 (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

mod.ImportLog = rts.load("Log");
mod.ImportTest0 = rts.load("Test0");
mod.Import$std = rts.load("$std");
mod.$w = new rts.Obj(new rts.Type("ANY"));
mod.$x = new rts.Obj(new rts.Type("ANY"));
mod.$y = new rts.Obj(new rts.Type("ANY"));
mod.$z = new rts.Obj(new rts.Type("ANY"));
mod.$ret = new rts.Obj(new rts.Type("ANY"));
mod.$m = new rts.Obj(new rts.Type("ANY"));

mod.$Do = function(){
var $i = new rts.Obj(new rts.Type("ANY"));
var $j = new rts.Obj(new rts.Type("ANY"));
var $k = new rts.Obj(new rts.Type("ANY"));
mod.$y.value((new rts.Value("INTEGER", 1)));
$i.value((new rts.Value("INTEGER", 10)));
(mod.ImportTest0.$Do());
$j.value((rts.copyOf(mod.ImportTest0.$j.value())));
$k.value((rts.copyOf($j.value())));
};

mod.$Do0 = function(){
var $a = new rts.Obj(new rts.Type("ANY"));
var $i = new rts.Obj(new rts.Type("INTEGER"));
var $b = new rts.Obj(new rts.Type("BOOLEAN"));
$a.value((new rts.Value("ANY", global.NONE)));
$i.value((new rts.Value("INTEGER", 1945)));
$b.value((new rts.Value("BOOLEAN", true)));
mod.$z.value((new rts.Value("ANY", global.NONE)));
(mod.$Do1());
};

mod.$Do1 = function(){
var $s = new rts.Obj(new rts.Type("INTEGER"));
var $f = new rts.Obj(new rts.Type("INTEGER"));
(mod.$Do2((new rts.Value("INTEGER", 15)),
$s));
(mod.ImportTest0.$Do0($f));
(mod.$Do((new rts.Value("INTEGER", 144)),
(rts.copyOf(mod.$m.value()))));
(mod.ImportTest0.$Do0(mod.$m));
(mod.ImportTest0.$Do0(mod.ImportTest0.$j));
};

mod.$Do2 = function(){
var $i = new rts.Obj(new rts.Type("INTEGER"));
var $j = new rts.Obj(new rts.Type("INTEGER"));
var $k = new rts.Obj(new rts.Type("INTEGER"));
$i.value(arguments[0]);
if(arguments[1] !== undefined){
if(!rts.isValue(arguments[1])){
$j = arguments[1];
} else {
$j.value(arguments[1]);
}
}

$j.value((new rts.Value("INTEGER", 443)));
mod.$ret.value((rts.copyOf($j.value())));
};
mod.start = function(){
mod.$x.value((new rts.Value("INTEGER", 1984)));
(mod.$Do());
mod.ImportTest0.$i.value((new rts.Value("INTEGER", 1)));
mod.$z.value((rts.copyOf(mod.$x.value())));
mod.$w.value((rts.copyOf(mod.ImportTest0.$j.value())));
(mod.$Do0());
(mod.$Do2((new rts.Value("INTEGER", 0)),
(new rts.Value("INTEGER", 1)),
(new rts.Value("INTEGER", 2)),
(new rts.Value("INTEGER", 3))));
};
}
module.exports = function(rts){return new UnitTest1 (rts)};