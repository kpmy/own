/**
 * Created by petry_000 on 12.05.2016.
 */
const should = require("should");
const _ = require("underscore");

function Parser(sc) {
    this["pr"] = rerequire("./help.js")(sc);
    this["sc"] = sc;
    this["tgt"] = null;
    
    this.mod = function () {
        this.pr.expect(sc.UNIT, sc.SEPARATOR, sc.DELIMITER);
        this.pr.next();
        this.pr.expect(sc.IDENT, sc.DELIMITER);
        var mod = this.pr.ident();
        this.pr.next();
        console.log(mod);
        this.tgt = rerequire("./target.js")(mod);
        
        this.pr.expect(sc.END, sc.SEPARATOR, sc.DELIMITER);
        this.pr.next();
        this.pr.expect(sc.IDENT, sc.DELIMITER);
        if(!_.isEqual(mod, this.pr.ident()))
            this.sc.mark("wrong module name");
        this.pr.next();
        
        return this.tgt.result();
    };
    
    this.pr.next();
}

module.exports = function (sc) {
    return new Parser(sc);
};