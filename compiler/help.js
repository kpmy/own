/**
 * Created by petry_000 on 12.05.2016.
 */
const should = require("should");
const _ = require("underscore");

function Helper(sc) {
    this["sc"] = sc;
    this["sym"] = sc.EMPTY;
    this.handled = false;

    this.codeIs = function (sym) { //string as sym, for dynamic symbols
        return _.isEqual(this.sym.code, sym);
    };
    
    this.is = function (sym) {
        should.exist(sym);
        return _.isEqual(this.sym.code, sym.code);
    };

    this.next = function () {
        this.handled = true;
        if (!this.is(sc.EMPTY)) {
            //console.log(this.sym);
        }

        this.sym = this.sc.get();
        console.log(this.sym);
    };

    this.wait = function () {
        should.ok(arguments.length > 0);
        should.ok(this.handled);

        const skip = Array.prototype.slice.call(arguments, 1);

        var skipped = function(x){
            var ok = false;
            skip.forEach(function (test) {
                if (_.isEqual(x.code, test.code))
                    ok = true;
            });
            return ok;
        };
        var s = arguments[0];
        for(;!this.is(s) && skipped(this.sym) && !this.sc.eof; this.next()){
            //console.log(this.sym);
        };
        this.handled = !this.is(s);
        return this.is(s);
    };

    this.expect = function () {
        should.ok(arguments.length > 0);
        should.ok(this.handled);
        if (!this.wait.apply(this, arguments))
            this.sc.mark("expected ", arguments[0].code, " found ", this.sym.code);

        this.handled = false;
    };

    this.pass = function () {
        const skip = Array.prototype.slice.call(arguments, 0);
        var skipped = function(x){
            var ok = false;
            skip.forEach(function (test) {
                if (_.isEqual(x.code, test.code))
                    ok = true;
            });
            return ok;
        };
        for(;skipped(this.sym) && !this.sc.eof; this.next()){
            //console.log(this.sym);
        };
    };

    this.ident = function () {
        should.ok(this.is(sc.IDENT));
        return this.sym.value;
    }
}

module.exports = function (sc) {
    return new Helper(sc);
}