/**
 * Created by kpmy on 11.06.2016.
 */
global.rerequire = require("require-new");
const Promise = require("bluebird");

console.log("own");
let name = "test/Test11.ow";

new Promise((r, e) => {
    rerequire("./compiler/owl.js")(name);
}).then(process.exit);