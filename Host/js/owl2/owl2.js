/**
 * Created by petry_000 on 22.06.2016.
 */

module.exports.build = function (ot) {
    let builder = rerequire("./ot2owl2.js");
    return builder.build(ot);
};