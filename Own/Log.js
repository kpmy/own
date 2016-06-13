function UnitLog(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.Import$std = rts.load("$std");
    mod.start = function () {
        console.log('dynamic load Log');
    };
}
module.exports = function (rts) {
    return new UnitLog(rts)
};