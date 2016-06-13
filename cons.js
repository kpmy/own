/**
 * Created by kpmy on 11.06.2016.
 */
global.rerequire = require("require-new");
let own = require("./Host")(__dirname + "/Own");

own.compile("Test11");
own.rts.load("Test11");
own.rts.dump();
//process.exit();
