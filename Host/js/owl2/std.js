/**
 * Created by petry_000 on 23.06.2016.
 */

let Class = require("./class.js");
let ObjectProperty = require("./oprop.js");
let DataProperty = require("./dprop.js");

function Builtin() {
    let s = this;

    s.classes = {
        "INTEGER": new Class("INTEGER")
    };

    s.props = {
        "hasIntValue": new DataProperty()
    }
}

module.exports = function () {
    return new Builtin();
};