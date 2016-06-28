/**
 * Created by petry_000 on 28.06.2016.
 */

module.exports.ClassPredicate = function (cls) {
    let p = this;
    p.class = cls;
};

module.exports.DataRangePredicate = function (type, left, right) {
    let p = this;
};

module.exports.DataCardinalityPredicate = function (prop, num) {
    let p = this;
};

module.exports.And = And;

function And() {
    let p = this;
    p.predicates = Array.from(arguments);
}

