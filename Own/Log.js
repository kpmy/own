function UnitLog (rts){
const types = rts.types;
const tpl = rts.tpl;
const mod = this;

    mod.ImportConsole = rts.load("Console");
mod.Import$std = rts.load("$std");

    mod.$String = function () {
        var $s = new rts.Obj(new rts.Type("STRING"));
        $s.value(arguments[0]);
        (mod.ImportConsole.$Print((rts.copyOf($s.value()))));
    };
mod.start = function(){
};
}
module.exports = function(rts){return new UnitLog (rts)};