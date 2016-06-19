/**
 * Created by kpmy on 13.06.2016.
 */

let fs = require("fs");
let _ = require('underscore');
let should = require("should");

function resolveDef(root) {
    return function (name) {
        if (_.isEqual(name, "$std")) {
            return rerequire("./ir/def.js").std();
        } else {
            var dn = root + "/" + name + ".od";
            var dd = fs.openSync(dn, "r");
            var def = fs.readFileSync(dd, "utf8");
            fs.closeSync(dd);
            return rerequire("./ir/def.js").read(def);
        }
    };
}

function Own(root) {
    let o = this;

    o.rts = rerequire("./rts.js")(root);

    o.compile = function (name) {
        var sn = root + "/" + name + ".ow";
        var sd = fs.openSync(sn, "r");
        var source = fs.readFileSync(sd, "utf8");
        fs.closeSync(sd);
        var sc = rerequire("./scan.js")(source);
        var p = rerequire("./parse.js")(sc, resolveDef(root));
        var mod = p.mod();
        should.exist(mod);
        //console.dir(mod, {depth: null});

        var def = rerequire("./ir/def.js").write(mod);
        var dd = fs.openSync(root + "/" + name + ".od", "w");
        fs.writeFileSync(dd, def, "utf8");
        rerequire("./ir/def.js").read(def);
        fs.closeSync(dd);

        //для вдумчивого дебага
        var ad = fs.openSync(root + "/" + name + ".ox", "w");
        rerequire("./ir/xml.js").writer(mod, fs.createWriteStream(".", {
            defaultEncoding: 'utf8',
            autoClose: true,
            "fd": ad
        }));

        var js = rerequire("./transpiler/js.js")(mod, resolveDef(root));
        var jd = fs.openSync(root + "/" + name + ".js", "w");
        fs.writeFileSync(jd, js, "utf8");
        fs.closeSync(jd);
    }
}

module.exports = function (pwd) {
    return new Own(pwd);
};