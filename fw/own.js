/**
 * Created by petry_000 on 25.05.2016.
 */
const rts = rerequire("../compiler/rt/rts.js")(process.cwd()+"/out");

module.exports.load = function (name) {
    const test = rts.load(name);
    rts.dump();
};