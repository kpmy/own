/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
function Builder(mod, s) {
    this.build = function () {
        s.write(`function ${mod.name} (rts){};`);
        
        s.write('\n');
        s.write(`module.exports = function(rts){
            console.log('dynamic load ${mod.name}'); 
            return new ${mod.name} (rts)
};`);
    };
}
module.exports = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Builder(mod, stream).build();
    }
};