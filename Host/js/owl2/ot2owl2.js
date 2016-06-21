/* Created by kpmy on 22.06.2016 */
let _ = require("underscore");
let should = require("should");

let Class = rerequire("./class.js");

function Builder(ot) {
    const b = this;
    var classMap = {};

    classMap["$"] = new Class();

    b.run = function (c, root) {
        root.children.forEach(c => {
            switch (c.qid.cls) {

                default:
                    throw new Error(`unknown class ${c.qid.cls}`);
            }
        });
    };

    b.build = function () {
        b.run(classMap["$"], ot);
        return classMap["$"];
    }
}

function build(ot) {
    return new Builder(ot).build();
}

module.exports.build = build;