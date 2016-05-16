/**
 * Created by petry_000 on 12.05.2016.
 */

function Module() {

}
Module.prototype.name = null;
Module.prototype.imports = [];
Module.prototype.start = [];
Module.prototype.stop = [];

function Definition() {
    
}
Definition.prototype.name = null;

function Import() {
    
}
Import.prototype.name = null;
Import.prototype.alias = null;
Import.prototype.def = null;
Import.prototype.imports = [];

module.exports.mod = function () {
    return new Module();
};

module.exports.def = function () {
    return new Definition();
};

module.exports.imp = function () {
    return new Import();
};