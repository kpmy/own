function UnitTest10(rts) {
    const types = rts.types;
    const tpl = rts.tpl;
    const mod = this;

    mod.Import$std = rts.load("$std");
    mod.$Magenta = new rts.Const((new rts.Value("ATOM", "Magenta")));
    mod.$html = new rts.Const((new rts.Value("ATOM", function () {
        var t = new tpl.Leaf();
        t.qid = new tpl.Qualident(undefined, "html", undefined);
        t.clazz = new tpl.Clazz(undefined, "html");
        t.unique = false;
        t.push(function () {
            var t = new tpl.Leaf();
            t.qid = new tpl.Qualident(undefined, "body", undefined);
            t.clazz = new tpl.Clazz(undefined, "body");
            t.unique = false;
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "attr", undefined);
                t.clazz = new tpl.Clazz(undefined, "attr");
                t.unique = true;
                t.push(function () {
                    var t = new tpl.Leaf();
                    t.qid = new tpl.Qualident(undefined, "hello", undefined);
                    t.clazz = new tpl.Clazz(undefined, "hello");
                    t.unique = false;
                    return t
                }());
                return t
            }());
            t.push(function () {
                var t = new tpl.Leaf();
                t.qid = new tpl.Qualident(undefined, "p", undefined);
                t.clazz = new tpl.Clazz(undefined, "p");
                t.unique = false;
                t.push(function () {
                    var t = new tpl.Leaf();
                    t.qid = new tpl.Qualident(undefined, "br", undefined);
                    t.clazz = new tpl.Clazz(undefined, "br");
                    t.unique = false;
                    return t
                }());
                t.push(function () {
                    var t = new tpl.Leaf();
                    t.qid = new tpl.Qualident(undefined, "br", undefined);
                    t.clazz = new tpl.Clazz(undefined, "br");
                    t.unique = false;
                    return t
                }());
                t.push(function () {
                    var v = new tpl.Value(types.find("STRING"), `br`);
                    return v
                }());
                return t
            }());
            return t
        }());
        return t
    }())));
    mod.$int = new rts.Const((new rts.Value("INTEGER", 455)));
    mod.$t = new rts.Obj(new rts.Type("TYPE"));
    mod.$s = new rts.Obj(new rts.Type("SET"));
    mod.$a = new rts.Obj(new rts.Type("ATOM"));
    mod.$b = new rts.Obj(new rts.Type("ATOM"));
    mod.start = function () {
        console.log('dynamic load Test10');
        mod.$s.value((new rts.Value("SET", [(new rts.Value("INTEGER", 1)),
            (new rts.Value("INTEGER", 2)),
            (new rts.Value("INTEGER", 3)),
            (new rts.Value("INTEGER", 4))])));
        mod.$t.value((function () {
            var tmp1 = new rts.Obj(new rts.Type("TYPE"));
            (mod.Import$std.$TYPEOF(tmp1,
                (rts.copyOf(mod.$s.value()))));
            return tmp1.value();
        }()));
        mod.$a.value((new rts.Value("ATOM", "BurninChrome")));
        mod.$b.value((rts.copyOf(mod.$Magenta.value())));
    };
}
module.exports = function (rts) {
    return new UnitTest10(rts)
};