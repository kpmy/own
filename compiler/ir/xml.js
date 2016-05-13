/**
 * Created by petry_000 on 13.05.2016.
 */
const should = require("should");
const xml = require("xml");
const sax = require("sax");
const _ = require('underscore');
const ast = rerequire("./ast.js");

function Writer(mod, stream) {
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
        mod.imports.forEach(function (i) {
            const attrs = _.isEmpty(i.alias) ? {name: i.name} : {name: i.name, alias: i.alias};
            unit.push({"import": {_attr: attrs}});
        });
        unit.close();
    }
}

function Reader(ret, stream) {
    this.read = function () {
        var xs = sax.createStream(true);
        var mod = null;
        var stack = [];
        xs.onopentag = function (n) {
            switch (n.name){
                case "unit":
                    if(_.isEmpty(stack)){
                        mod = ast.mod();
                        mod.name = n.attributes["name"];
                    } else {
                        throw Error("unexpected unit tag");
                    }
                    break;
                case "import":
                    var imp = ast.imp();
                    imp.name = n.attributes["name"];
                    imp.alias = n.attributes.hasOwnProperty("alias") ? n.attributes["alias"] : "";
                    console.log("need resolve", imp.name);
                    imp.def = ast.def();
                    mod.imports.push(imp);
                    break;
                default:
                    throw new Error("unknown tag "+n.name);
            }
        };
        
        xs.onclosetag = function (name) {
            var x = stack.pop();
            switch (name) {
                case "unit":
                    if (_.isEmpty(stack)){
                        ret(mod);
                    } else {
                        throw new Error("unexpected unit close tag");
                    }
                    break;
                case "import":
                    //do nothing
                    break;
                default:
                    throw new Error("unknown close tag "+name);
            }
        };
        
        stream.pipe(xs);
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