function UnitDemo0(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.Import$std = rts.load("$std");
    mod.start = function () {
};
}
module.exports = function (rts) {
    return new UnitDemo0(rts)
};