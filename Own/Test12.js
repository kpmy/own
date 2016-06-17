function UnitTest12(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.Import$std = rts.load("$std");
    mod.$x = new rts.Obj(new rts.Type("INTEGER"));
    mod.$y = new rts.Obj(new rts.Type("INTEGER"));
    mod.$z = new rts.Obj(new rts.Type("INTEGER"));
    mod.$t = new rts.Obj(new rts.Type("TYPE"));
    mod.start = function () {
        console.log('dynamic load Test12');
        if (rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf(mod.$x.value()))
            }, "IS", function () {
                return (new rts.Value("TYPE", types.find("INTEGER")))
            })))) {
            mod.$x.value((new rts.Value("INTEGER", 1)));
}
        mod.$t.value((function () {
            var tmp1 = new rts.Obj(new rts.Type("TYPE"));
            (mod.Import$std.$TYPEOF(tmp1,
                (rts.copyOf(mod.$x.value()))));
            return tmp1.value();
        }()));
        if (rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf(mod.$x.value()))
            }, "IS", function () {
                return (rts.copyOf(mod.$t.value()))
            })))) {
            mod.$x.value((new rts.Value("INTEGER", 2)));
        }
        var cond2 = new rts.Value("ANY", (rts.copyOf(mod.$x.value())));
        if (cond2.isValueEqual((new rts.Value("INTEGER", 1)))) {
            mod.$y.value((new rts.Value("INTEGER", 3)));
        } else if (cond2.isValueEqual((new rts.Value("INTEGER", 2)))) {
            mod.$y.value((new rts.Value("INTEGER", 2)));
        } else if (cond2.isValueEqual((new rts.Value("INTEGER", 3)))) {
            mod.$y.value((new rts.Value("INTEGER", 1)));
        } else {
            mod.$y.value((new rts.Value("INTEGER", 0)));
        }
        var cond3 = new rts.Value("ANY", (rts.copyOf(mod.$x.value())));
        if (cond3.isTypeEqual((new rts.Value("TYPE", types.find("INTEGER"))))) {
            mod.$y.value((new rts.Value("INTEGER", 2)));
        } else if (cond3.isTypeEqual((new rts.Value("TYPE", types.find("BOOLEAN"))))) {
            mod.$y.value((new rts.Value("INTEGER", 3)));
        } else {
            mod.$y.value((new rts.Value("INTEGER", 0)));
        }
        if (rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf(mod.$x.value()))
            }, "=", function () {
                return (new rts.Value("INTEGER", 1))
            })))) {
            mod.$y.value((new rts.Value("INTEGER", 2)));
        } else if (rts.getNative("boolean", (rts.math.dop(function () {
                return (rts.copyOf(mod.$x.value()))
            }, "=", function () {
                return (new rts.Value("INTEGER", 2))
            })))) {
            mod.$y.value((new rts.Value("INTEGER", 3)));
        } else {
            mod.$y.value((new rts.Value("INTEGER", 0)));
        }
        var cond4_0 = new rts.Value("ANY", (rts.copyOf(mod.$x.value())));
        var cond4_1 = new rts.Value("ANY", (rts.copyOf(mod.$y.value())));
        var cond4_2 = new rts.Value("ANY", (rts.copyOf(mod.$z.value())));
        if (cond4_0.isValueEqual((new rts.Value("INTEGER", 1))) && ((true)) && cond4_2.isValueEqual((new rts.Value("INTEGER", 2)))) {
            mod.$t.value((new rts.Value("ANY", global.NONE)));
        } else if (cond4_0.isValueEqual((new rts.Value("INTEGER", 3))) && cond4_1.isValueEqual((new rts.Value("INTEGER", 4))) && cond4_2.isValueEqual((rts.math.dop(function () {
                return (new rts.Value("INTEGER", 5))
            }, "+", function () {
                return (new rts.Value("INTEGER", 1))
            })))) {
            mod.$t.value((new rts.Value("ANY", global.NONE)));
        } else {
            mod.$t.value((new rts.Value("ANY", global.NONE)));
        }
};
}
module.exports = function (rts) {
    return new UnitTest12(rts)
};