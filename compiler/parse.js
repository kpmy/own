/**
 * Created by petry_000 on 12.05.2016.
 */
const should = require("should");
const _ = require("underscore");
const ast = rerequire("./ir/ast.js");

function Parser(sc) {
    this["pr"] = rerequire("./help.js")(sc);
    this["sc"] = sc;
    this["tgt"] = null;
    const p = this; //use with care within closures...

    this.resolve = function (name) {
        return ast.def();
    };

    this.block = function (b, sym) {
        if(_.isEqual(sym, sc.UNIT)){
            var cache = {};
            while(this.pr.wait(sc.IMPORT, sc.SEPARATOR, sc.DELIMITER)){
                this.pr.next();
                for(var stop = false; !stop;){
                    if (this.pr.wait(sc.IDENT, sc.SEPARATOR, sc.DELIMITER)){
                        var name = this.pr.ident();
                        var alias = "";
                        this.pr.next();
                        if (this.pr.wait(sc.ASSIGN, sc.DELIMITER)){
                            this.pr.next();
                            this.pr.expect(sc.IDENT, sc.DELIMITER);
                            alias = this.pr.ident();
                            this.pr.next();
                        }
                        var imp = ast.imp();
                        if(!b.hasImport(alias)){
                            if (_.isEqual(name, this.tgt.mod.name)){
                                this.sc.mark("module cannot import itself");
                            }
                            imp.name = name;
                            imp.alias = alias;
                            if(!cache.hasOwnProperty(name)){
                                imp.def = this.resolve(name);
                                cache[name] = imp;
                            } else {
                                imp.def = cache[name].def;
                            }
                            const noCycle = function (i) {
                                i.imports.forEach(function (ii) {
                                    if(_.isEqual(ii.name, p.tgt.mod.name)){
                                        p.sc.mark("cyclic import from ", i.name);
                                    } else {
                                        noCycle(ii);
                                    };
                                });
                            };
                            noCycle(imp);
                            b.imports.push(imp);
                        } else {
                            this.sc.mark("import already exists ", alias);
                        }
                    } else if (Object.keys(cache).length > 0){
                        stop = true;
                    } else {
                        this.sc.mark("nothing to import");
                    }
                }
            }
        } else {
            this.sc.mark("unexpected block type ", sym.code);
        }
    };

    this.mod = function () {
        this.pr.expect(sc.UNIT, sc.SEPARATOR, sc.DELIMITER);
        this.pr.next();
        this.pr.expect(sc.IDENT, sc.DELIMITER);
        var mod = this.pr.ident();
        this.pr.next();
        this.tgt = rerequire("./target.js")(mod);
        var block = this.tgt.pushBlock();
        this.block(block, sc.UNIT);
        this.tgt.popBlock();
        this.tgt.mod.imports = block.imports;
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