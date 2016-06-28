/* Created by kpmy on 28.06.2016 */
let _ = require("underscore");
let should = require("should");

let builtin = require("./std.js")();

let Class = require("./class.js");

let ClassPredicate = require("./predicate.js").ClassPredicate;

module.exports = Macro;

function Macro(root) {
    let m = this;

    m.getBaseClass = function () {
        let classes = Array.from(root.description).filter(p => is(p).type(ClassPredicate)).map(p => p.class).concat();
        let std = classes.filter(c => _.has(builtin.classes, c.IRI));
        let nonStd = classes.filter(c => !_.has(builtin.classes, c.IRI));
        should.ok(_.isEmpty(nonStd));
        should.ok(!_.isEmpty(std) && std.length == 1);
        return std[0];
    };

    should.ok(is(root).type(Class));
}