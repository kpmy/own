/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
function Builder(mod, stream) {
    this.build = function () {
        stream.write("function "+mod.name+"(rts){");
        stream.write("\n");
        stream.write("};");
        stream.write("\n");
        stream.write("module.exports=function(rts){console.log('dynamic load'); return new "+mod.name+"(rts)};");
    };
};

module.exports = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Builder(mod, stream).build();
    }
};