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
      mod.imports.forEach(i => {def.imports.push(i.name)});
      mod.blocks.forEach(b => {
          var bd = {
              name: b.name,
              objects: {}
          };
          Array.from(Object.keys(b.objects))
              .filter(o => _.isObject(b.objects[o].param))
              .forEach(o => {
                  var obj = b.objects[o];
                  bd.objects[o] = {
                      name: obj.name,
                      type: {name: obj.type.name},
                      param: {type: obj.param.type, number: obj.param.number}
                  };
              });
          def.blocks.push(bd);
      });
      Array.from(Object.keys(mod.objects))
          .map(k => mod.objects[k])
          .forEach(o => {
              var od = {
                  name: o.name,
                  type: {name: o.type.name}
              };

              def.objects[o.name] = od;
          });
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