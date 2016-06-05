/* Created by kpmy on 10.05.2016 */
const fs = require("fs");
const should = require('should/as-function');
const _ = require('underscore');
const Promise = require("bluebird"); //developers promise with trace

function readSource(f) {
    return new Promise(function(fn, no) {
        should.exist(f);
        var fd = fs.openSync(f, "r");
        should.exist(fd);
        fs.createReadStream(".", {
            "fd": fd,
            "encoding": "utf8",
            "autoClose": true
        }).once("readable", function () {
            fn(this);
        });
    })
}

function writeTarget(f) {
    return new Promise(function (fn, no) {
        should.exist(f);
        var fd = fs.openSync(f, "w");
        should.exist(fd);
        var stream = fs.createWriteStream(".", {
            defaultEncoding: 'utf8',
            autoClose: true,
            "fd": fd
        });
        fn(stream);
    });
}

module.exports = function (f) {
    var root = process.cwd()+"/test";

    var resolveDef = function (name) {
        if (_.isEqual(name, "$std")) {
            return new Promise((r, x) => {
                var std = rerequire("./ir/def.js").std();
                r(std);
            });
        } else {
            return new Promise(function (res, rej) {
                var rd = rerequire("./ir/def.js").reader(function (def) {
                    res(def);
                });
                readSource(root + "/" + name + ".od").then(rd);
            });
        }
    };

    readSource(f).then(
        stream => {
            var ps = rerequire("./parse.js")(rerequire("./scan.js")(stream), resolveDef);
            ps.mod().then(
                mod => {
                should.exist(mod);
                //console.dir(mod, {depth: null});
                { //definition of module
                    var wr = rerequire("./ir/def.js").writer(mod);
                    writeTarget(root+"/"+mod.name+".od").then(wr);
                    var rd = rerequire("./ir/def.js").reader(function (def) {
                        //console.dir(def, {depth: null});
                    });
                    readSource(root+"/"+mod.name+".od").then(rd);
                }
                { //ast of module
                    var wr = rerequire("./ir/xml.js").writer(mod);
                    writeTarget(root+"/"+mod.name + ".ox").then(wr);
                    var rd = rerequire("./ir/xml.js").reader(function (mod) {
                        should.exist(mod);
                        //js dump of module
                        var js = rerequire("./transpiler/js.js");
                        writeTarget(process.cwd() + "/out/" + mod.name + ".js").then(js(mod, resolveDef));
                        setTimeout(function () {
                            //return; //need no run
                            new Promise((r, e) => {
                                const rts = rerequire("./rt/rts.js")(process.cwd() + "/out");
                                const test = rts.load(mod.name);
                                rts.dump();
                            });
                        }, 100);
                    });
                    readSource(root+"/"+mod.name + ".ox").then(rd);
                }
            })
        })//.catch(error => {console.trace(error);});
};;