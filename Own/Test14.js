function UnitTest14(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.ImportConsole = rts.load("Console");
    mod.Import$std = rts.load("$std");
    mod.$file = new rts.Obj(new rts.Type("MAP"));
    mod.$x = new rts.Obj(new rts.Type("INTEGER"));
    mod.$proc = new rts.Obj(new rts.Type("BLOCK"));

    mod.$Do = function () {
        mod.$x.value((new rts.Value("INTEGER", 10)));
};
    mod.start = function () {
        mod.$file.value((new rts.Value("MAP", [[(new rts.Value("STRING", `bmFtZQ==`, "base64")), (new rts.Value("STRING", `VGVzdDE0`, "base64"))],
            [(new rts.Value("ATOM", "ext")), (new rts.Value("STRING", `b3c=`, "base64"))],
            [(new rts.Value("ATOM", "doit")), (new rts.Value("ANY", global.NONE))]])));
        (mod.ImportConsole.$Print((rts.copyOf(mod.$file.value()))));
        (mod.ImportConsole.$Print((rts.copyOf(mod.$file.select((new rts.Value("STRING", `bmFtZQ==`, "base64"))).value())),
            (rts.copyOf(mod.$file.select((new rts.Value("ATOM", "ext"))).value()))));
        mod.$file.select((new rts.Value("ATOM", "ext"))).value((new rts.Value("STRING", `b2c=`, "base64")));
        (mod.ImportConsole.$Print((rts.copyOf(mod.$file.select((new rts.Value("STRING", `bmFtZQ==`, "base64"))).value())),
            (rts.copyOf(mod.$file.select((new rts.Value("ATOM", "ext"))).value()))));
        mod.$file.select((new rts.Value("ATOM", "doit"))).value((new rts.Value("BLOCK", mod.$Do)));
        mod.$proc.value((rts.copyOf(mod.$file.select((new rts.Value("ATOM", "doit"))).cast((new rts.Value("TYPE", types.find("BLOCK")))).value())));
        mod.$proc.call();
        (mod.ImportConsole.$Print((rts.copyOf(mod.$x.value()))));
};
}
module.exports = function (rts) {
    return new UnitTest14(rts)
};