/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
const xml = require("xml");

function Builder(mod, stream) {
    this.build = function() {
        stream.write('<?xml version="1.0" encoding="UTF-8"?>\n'); //header :(
        var unit = xml.element({_attr: {name: mod.name}});
        var xs = xml({"unit": unit}, {stream: true});
        xs.on("data", function (chunk) {
            stream.write(chunk);
        });
        xs.once("end", function () {
            stream.end();
        });
        unit.close();
    }
}

module.exports = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Builder(mod, stream).build();
    }
};