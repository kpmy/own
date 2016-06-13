function UnitTest5(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.ImportTest4 = rts.load("Test4");
    mod.Import$std = rts.load("$std");
    mod.$i = new rts.Obj(new rts.Type("INTEGER"));
    mod.start = function () {
        console.log('dynamic load Test5');
        (mod.ImportTest4.$Do((new rts.Value("INTEGER", 11))));
        mod.ImportTest4.$x.value((new rts.Value("INTEGER", 12)));
    };
}
module.exports = function (rts) {
    return new UnitTest5(rts)
};