/* Created by kpmy on 10.06.2016 */

function Qualident(cls) {
    const i = this;
    i.cls = cls;
}

function Leaf() {
    const l = this;
    l.qid = new Qualident();
}

function Struct() {
    const s = this;
    s.Qualident = Qualident;
    s.Leaf = Leaf;
}

module.exports.struct = function () {
    return new Struct();
};