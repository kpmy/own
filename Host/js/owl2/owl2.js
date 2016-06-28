/**
 * Created by petry_000 on 22.06.2016.
 */
let Macro = require("./macro.js");

module.exports.macro = function (cls) {
    return new Macro(cls)
};

module.exports.build = function (ot) {
    let builder = require("./ot2owl2.js");
    return builder.build(ot);
};