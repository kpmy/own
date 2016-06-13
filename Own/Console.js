function UnitConsole(rts) {
    const mod = this;

    mod.$Print = function () {
        var out = Array.from(arguments)
            .map(x => rts.isValue(x) ? x.value : "")
            .concat();
        /*out.forEach(x => {
         if (typeof x =="string"){
         for(var i = 0; i<x.length; i++){
         console.log(x.charCodeAt(i));
         }
         }
         });*/
        console.log(...out);
    };

    mod.start = function () {
    };
}
module.exports = function (rts) {
    return new UnitConsole(rts)
};