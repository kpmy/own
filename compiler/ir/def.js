/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
const _ = require('underscore');
const ast = rerequire("./ast.js");
const jsonStream = require('JSONStream');

function Writer(mod, stream) {

  this.build = function() {
      var def = ast.def();
      def.name = mod.name;

      var js = jsonStream.stringifyObject();
      js.pipe(stream);
      js.write(["definition", def]);
      js.end();
  }
}

function Reader(ret, stream) {
    this.read = function () {
        const es = require('event-stream');
        var jp = jsonStream.parse('$*');
        stream.pipe(jp).pipe(es.mapSync(function (def) {
            should.ok(_.isEqual("definition", def.key));
            var res = ast.def();
            res = Object.assign(res, def.value);
            //console.log(res);
            ret(res);
        }));
    }
}

module.exports.writer = function (mod) {
    should.exist(mod);
    return function (stream) {
        should.exist(stream);
        new Writer(mod, stream).build();
    }
};

module.exports.reader = function (ret) {
    should.exist(ret);
    return function (stream) {
        should.exist(stream);
        new Reader(ret, stream).read();
    };
};