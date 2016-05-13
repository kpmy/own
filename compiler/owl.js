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
    var root = process.cwd()+"/test";
    
    readSource(f, function (stream) {
        var ps = rerequire("./parse.js")(rerequire("./scan.js")(stream));
        mod = ps.mod();
        should.exist(mod);
        console.log(mod);
        { //definition of module
            var wr = rerequire("./ir/def.js").writer(mod); 
            writeTarget(root+"/"+mod.name+".od", wr);
            var rd = rerequire("./ir/def.js").reader(function (def) {
                console.log(def);
            });
            readSource(root+"/"+mod.name+".od", rd);
        }
        { //ast of module
            var wr = rerequire("./ir/xml.js").writer(mod);
            writeTarget(root+"/"+mod.name + ".ox", wr);
            var rd = rerequire("./ir/xml.js").reader(function (mod) {
                should.exist(mod);
                //js dump of module
                var js = rerequire("./transpiler/js.js");
                writeTarget(process.cwd() + "/out/" + mod.name.toLowerCase() + ".js", js(mod));
                setTimeout(function () {
                    rerequire(process.cwd() + "/out/" + mod.name.toLowerCase() + ".js")({});
                }, 100);
            });
            readSource(root+"/"+mod.name + ".ox", rd);
        }
    });
};