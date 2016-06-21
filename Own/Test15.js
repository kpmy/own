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
        t.unique = true;
        t.push(function () {
            var t = new tpl.Leaf();
            t.qid = new tpl.Qualident(undefined, "SubClassOf", undefined);
            t.clazz = new tpl.Clazz(undefined, "SubClassOf");
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
        t.push(function () {
            var t = new tpl.Leaf();
            t.qid = new tpl.Qualident(undefined, "SubClassOf", undefined);
            t.clazz = new tpl.Clazz(undefined, "SubClassOf");
            t.unique = false;
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "hasIntValue", undefined);
                t.clazz = new tpl.Clazz(undefined, "hasIntValue");
                t.unique = false;
                return t
            }());
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "exactly", undefined);
                t.clazz = new tpl.Clazz(undefined, "exactly");
                t.unique = false;
                return t
            }());
            t.push(function () {
                var v = new tpl.Value(types.find("INTEGER"), 1);
                return v
            }());
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "AND", undefined);
                t.clazz = new tpl.Clazz(undefined, "AND");
                t.unique = false;
                return t
            }());
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "hasIntValue", undefined);
                t.clazz = new tpl.Clazz(undefined, "hasIntValue");
                t.unique = false;
                return t
            }());
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "some", undefined);
                t.clazz = new tpl.Clazz(undefined, "some");
                t.unique = false;
                return t
            }());
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "INTEGER", undefined);
                t.clazz = new tpl.Clazz(undefined, "INTEGER");
                t.unique = false;
                t.push(function () {
                    var v = new tpl.Value(types.find("INTEGER"), -128);
                    return v
                }());
                t.push(function () {
                    var v = new tpl.Value(types.find("INTEGER"), 127);
                    return v
                }());
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
};
}
module.exports = function (rts) {
    return new UnitTest15(rts)
};