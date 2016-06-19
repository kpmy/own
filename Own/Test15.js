function UnitTest15(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.ImportConsole = rts.load("Console");
    mod.Import$std = rts.load("$std");
    mod.$BYTE = new rts.Const((new rts.Value("TYPE", function () {
        var t = new tpl.Leaf();
        t.qid = new tpl.Qualident(undefined, "TYPE", undefined);
        t.clazz = new tpl.Clazz(undefined, "TYPE");
        t.unique = false;
        t.push(function () {
            var t = new tpl.Leaf();
            t.qid = new tpl.Qualident(undefined, "BASE", undefined);
            t.clazz = new tpl.Clazz(undefined, "BASE");
            t.unique = false;
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "INTEGER", undefined);
                t.clazz = new tpl.Clazz(undefined, "INTEGER");
                t.unique = false;
                return t
            }());
            return t
        }());
        return t
    }())));
    mod.$x = new rts.Obj(new rts.Type("INTEGER"));
    mod.$y = new rts.Obj(new rts.Type("USER", "BYTE", mod.$BYTE.value()));
    mod.start = function () {
        mod.$x.value((new rts.Value("INTEGER", 10)));
        mod.$y.value((new rts.Value("INTEGER", 44)));
        (mod.ImportConsole.$Print((rts.math.dop(function () {
            return (rts.copyOf(mod.$x.value()))
        }, "+", function () {
            return (rts.copyOf(mod.$y.value()))
        }))));
    };
}
module.exports = function (rts) {
    return new UnitTest15(rts)
};