/**
 * Created by kpmy on 11.06.2016.
 */
global.rerequire = require("require-new");
let own = require("./Host")(__dirname + "/Own");

let name = "Test13";
own.compile(name);
own.rts.load(name);
own.rts.dump();

function build() {
    Array.from(arguments).forEach(x => {
        console.log(x);
        own.compile(x)
    });
}

//build("Simple", "Log", "Test0", "Test1", "Test2", "Test3", "Test4", "Test5", "Test6", "Test7", "Test8", "Test9", "Test10", "Test11", "Test12", "Test13");
//process.exit();
