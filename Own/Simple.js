function UnitSimple(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.ImportConsole = rts.load("Console");
    mod.Import$std = rts.load("$std");
    mod.start = function () {
        console.log('dynamic load Simple');
        (mod.ImportConsole.$Print((new rts.Value("INTEGER", 0))));
    };
}
module.exports = function (rts) {
    return new UnitSimple(rts)
};