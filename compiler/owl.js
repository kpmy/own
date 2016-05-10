/**
 * Created by petry_000 on 10.05.2016.
 */
const fs = require("fs");
const should = require('should/as-function');
const _ = require('underscore');

module.exports = function (f) {
    should.exist(f);
    var fd = fs.openSync(f, "r");
    should.exist(fd);
    var stream = fs.createReadStream(".", {
        "fd": fd,
        "encoding": "utf8"
    });
    stream.once("readable", function () {
        var sc = rerequire("./scan.js")(this);
        for(var s = sc.START; !(_.isEqual(s, sc.EOF)); s = sc.get()){
            console.log(s);
        }
    });
    stream.once("end", function () {
        fs.closeSync(fd);
    });
};