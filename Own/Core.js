function UnitCore(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.Import$std = rts.load("$std");

    mod.$Load = function () {
        var $name = new rts.Obj(new rts.Type("STRING"));
        $name.value(arguments[0]);
        (mod.Import$std.$HANDLE((new rts.Value("MAP", [[(new rts.Value("STRING", `dHlwZQ==`, "base64")), (new rts.Value("STRING", `bG9hZA==`, "base64"))],
            [(new rts.Value("STRING", `bmFtZQ==`, "base64")), (rts.copyOf($name.value()))]]))));
    };
    mod.start = function () {
    };
}
module.exports = function (rts) {
    return new UnitCore(rts)
};