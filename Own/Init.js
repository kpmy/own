function UnitInit(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.ImportCore = rts.load("Core");
    mod.ImportLog = rts.load("Log");
    mod.Import$std = rts.load("$std");
    mod.start = function () {
        (mod.ImportLog.$String((new rts.Value("STRING", `b3duIHN0YXJ0ZWQ=`, "base64"))));
        (mod.ImportCore.$Load((new rts.Value("STRING", `RGVtbzA=`, "base64"))));
    };
}
module.exports = function (rts) {
    return new UnitInit(rts)
};