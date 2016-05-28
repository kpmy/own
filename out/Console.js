function UnitConsole(rts) {
    const mod = this;

    mod.$Print = function () {
        var out = Array.from(arguments)
            .map(x => rts.isValue(x) ? x.value : "")
            .concat();
        console.log(...out);
    };

    mod.start = function () {
    };
};

module.exports = function (rts) {
    return new UnitConsole(rts)
};