/* Created by kpmy on 13.05.2016 */
const should = require("should");
const _ = require('underscore');
const ast = rerequire("./ast.js");

function Writer(mod) {

  this.build = function() {
      var def = ast.def();
      def.name = mod.name;
      mod.imports.forEach(i => {def.imports.push(i.name)});
      mod.blocks
          .filter(b => b.exported)
          .forEach(b => {
          var bd = {
              name: b.name,
              infix: b.infix,
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
          .filter(o => !_.isEmpty(o.modifier))
          .forEach(o => {
              var od = {
                  name: o.name,
                  type: {name: o.type.name},
                  modifier: o.modifier
              };

              def.objects[o.name] = od;
          });
      return JSON.stringify({"definition": def});
  }
}

function Reader(source) {
    this.read = function () {
        var def = JSON.parse(source);
        var res = ast.def();
        return Object.assign(res, def.definition);
    }
}

module.exports.std = function () {
    var std = {
        name: "$std",
        imports: [],
        objects: {},
        blocks: [
            {
                name: "INC",
                objects: {
                    "x": {
                        name: "x",
                        type: {name: "INTEGER"},
                        param: {type: "reference", number: 0}
                    }
                }
            },
            {
                name: "DEC",
                objects: {
                    "x": {
                        name: "x",
                        type: {name: "INTEGER"},
                        param: {type: "reference", number: 0}
                    }
                }
            },
            {
                name: "ORD",
                infix: true,
                objects: {
                    "res": {
                        name: "res",
                        type: {name: "INTEGER"},
                        param: {type: "reference", number: 0}
                    },
                    "ch": {
                        name: "ch",
                        type: {name: "CHAR"},
                        param: {type: "value", number: 1}
                    }
                }
            },
            {
                name: "TYPEOF",
                infix: true,
                objects: {
                    "res": {
                        name: "res",
                        type: {name: "TYPE"},
                        param: {type: "reference", number: 0}
                    },
                    "o": {
                        name: "o",
                        type: {name: "ANY"},
                        param: {type: "value", number: 1}
                    }
                }
            },
            {
                name: "ASSERT",
                objects: {
                    "condition": {
                        name: "condition",
                        type: {name: "BOOLEAN"},
                        param: {type: "value", number: 0}
                    },
                    "code": {
                        name: "code",
                        type: {name: "ANY"},
                        param: {type: "value", number: 1}
                    }
                }
            },
            {
                name: "NEW",
                objects: {
                    "p": {
                        name: "p",
                        type: {name: "POINTER"},
                        param: {type: "reference", number: 0}
                    }
                }
            },
            {
                name: "HANDLE",
                objects: {
                    "msg": {
                        name: "msg",
                        type: {name: "MAP"},
                        param: {type: "value", number: 0}
                    },
                    "result": {
                        name: "result",
                        type: {name: "MAP"},
                        param: {type: "reference", number: 1}
                    }
                }
            }
        ]
    };
    var res = ast.def();
    res = Object.assign(res, std);
    return res;
};

module.exports.write = function (mod) {
    should.exist(mod);
    return new Writer(mod).build();
};

module.exports.read = function (source) {
    should.exist(source);
    return new Reader(source).read();
};