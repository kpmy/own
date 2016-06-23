/**
 * Created by petry_000 on 23.06.2016.
 */

let Class = rerequire("./class.js");
let ObjectProperty = rerequire("./oprop.js");
let DataProperty = rerequire("./dprop.js");

function BuiltIn() {
    let s = this;

    s.classes = {
        "INTEGER": new Class()
    };

    s.props = {
        "hasIntValue": new DataProperty()
    }
}

module.exports = function () {
    return new BuiltIn();
};