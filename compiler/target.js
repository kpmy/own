/**
 * Created by petry_000 on 12.05.2016.
 */

const ast = rerequire("./ir/ast.js");

function Target(name) {
    this.mod = ast.mod();
    this.mod.name = name;
    
    this.result = function () {
        return this.mod
    }
}

module.exports = function (name) {
    return new Target(name);
};