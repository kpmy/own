/* Created by kpmy on 11.06.2016 */
global.rerequire = require("require-new");
global.is = function (x) {
    let xn = x.constructor.name;
    return {
        type: function (t) {
            if (typeof t == "string")
                return t == xn;
            else if (typeof t == "function") {
                return t.name == xn;
            } else {
                throw new Error(`unsupported ${t}`);
            }
        }
    }
};

let root = __dirname + "/Own";
let own = require("./Host")(root);

let name = "Test15";
own.compile(name);
own.rts.load("Core");
//own.rts.load("Init");
own.rts.load(name);
own.rts.dump();

function build() {
    Array.from(arguments).forEach(x => {
        console.log(x);
        own.compile(x)
    });
}

//build("Simple", "Log", "Test0", "Test1", "Test2", "Test3", "Test4", "Test5", "Test6", "Test7", "Test8", "Test9", "Test10", "Test11", "Test12", "Test13", "Test14", "Test15");
//build("Core", "Log", "Init", "Demo0");
//process.exit();
