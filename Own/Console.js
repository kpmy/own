function UnitConsole(rts) {
    const mod = this;

    mod.$Print = function () {
        console.log("debug dump");
        Array.from(arguments).forEach(a => console.dir(a, {depth: null}));
    };

    mod.start = function () {
    };
}
module.exports = function (rts) {
    return new UnitConsole(rts)
};