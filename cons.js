/**
 * Created by kpmy on 11.06.2016.
 */
global.rerequire = require("require-new");
let own = require("./Host")(__dirname + "/Own");

let name = "Test11";
own.compile(name);
own.rts.load(name);
own.rts.dump();
//process.exit();
