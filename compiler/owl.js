/**
 * Created by petry_000 on 10.05.2016.
 */
const fs = require("fs");
const should = require('should/as-function');
const _ = require('underscore');

function readSource(f, fn) {
    should.exist(f);
    var fd = fs.openSync(f, "r");
    should.exist(fd);
    fs.createReadStream(".", {
        "fd": fd,
        "encoding": "utf8",
        "autoClose": true
    }).once("readable", function(){
        fn(this);
        //fs.closeSync(fd);
    });
}

function writeTarget(f, fn) {
    should.exist(f);
    var fd = fs.openSync(f, "w");
    should.exist(fd);
    var stream = fs.createWriteStream(".", {
        defaultEncoding: 'utf8',
        autoClose: true,
        "fd": fd
    });
    fn(stream);
}

module.exports = function (f) {
    var mod = null;
    readSource(f, function (stream) {
        var sc = rerequire("./scan.js")(stream);
        var ps = rerequire("./parse.js")(sc);
        mod = ps.mod();
        should.exist(mod);
        var gen = rerequire("./ir/xml.js");
        writeTarget(mod.name+".ox", gen(mod));
        var js = rerequire("./transpiler/js.js");
        writeTarget(mod.name.toLowerCase()+".js", js(mod));
        setTimeout(function(){
            rerequire(process.cwd()+"/"+mod.name.toLowerCase()+".js")({});
        }, 100);
    });
};