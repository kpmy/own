function UnitTest13(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.Import$std = rts.load("$std");
    mod.$z = new rts.Obj(new rts.Type("INTEGER"));
    mod.$p = new rts.Obj(new rts.Type("POINTER"));
    mod.$q = new rts.Obj(new rts.Type("POINTER"));

    mod.$Do0 = function () {
        var $x = new rts.Obj(new rts.Type("INTEGER"));
        var $y = new rts.Obj(new rts.Type("INTEGER"));
        $x.value(arguments[0]);
        if (!rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf($x.value()))
            }, ">", function () {
                return (new rts.Value("INTEGER", 0))
            })))) throw new Error("precondition 0 violated");
        if (!rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf($x.value()))
            }, "#", function () {
                return (new rts.Value("INTEGER", 0))
            })))) throw new Error("precondition 1 violated");
        (mod.Import$std.$ASSERT((rts.math.dop(function () {
                return (rts.copyOf(mod.$z.value()))
            }, "=", function () {
                return (new rts.Value("INTEGER", 1))
            })),
            (new rts.Value("INTEGER", 20))));
        $y.value((rts.copyOf($x.value())));
        if (!rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf($y.value()))
            }, ">", function () {
                return (new rts.Value("INTEGER", 0))
            })))) throw new Error("postcondition 0 violated");
};
    mod.start = function () {
        mod.$z.value((new rts.Value("INTEGER", 1)));
        (mod.$Do0((new rts.Value("INTEGER", 1))));
        (mod.Import$std.$NEW(mod.$p));
        if (rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf(mod.$p.value()))
            }, "#", function () {
                return (new rts.Value("POINTER", {adr: 0}))
            })))) {
            mod.$p.value((new rts.Value("INTEGER", 43)));
}
        mod.$q.value((rts.copyOf(mod.$p.value())));
        mod.$p.value((new rts.Value("POINTER", {adr: 0})));
};
}
module.exports = function (rts) {
    return new UnitTest13(rts)
};