/**
 * Created by petry_000 on 10.05.2016.
 */
const should = require("should/as-function");
const _ = require('underscore');

function Sym (type) {
    if(type)
        this["type"] = type;
}
Sym.prototype.type = "SYM";
Sym.prototype.code = null;

function thisSym(code) {
    var ret = new Sym();
    ret.code = code;
    return ret;
}

function Scanner(stream) {
    this.EOF = new Sym("EOF");
    this.START = new Sym("START"); //dumb sym
    this.EMPTY = new Sym("EMPTY");
    this.LPAREN = thisSym("(");
    this.SEPARATOR = thisSym(" ");

    this["stream"] = stream;
    this["eof"] = false;
    this["pos"] = 0;
    this["ch"] = null;

    this.mark = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        throw new Error(args.join(""));
    };

    this.next = function () {
        var c = this.stream.read(1);
        if(c) {
            this.pos++;
            this.ch = c;
            return c;
        } else {
            should.ok(!this.eof);
            this.eof = true;
            return this.EOF;
        }
    };

    this.comment = function () {
        should.equal(this.ch, "*");
        for(;;) {
            while(!this.eof && this.ch != "*"){
                if (this.ch == "(") {
                    if (this.next() == "*") {
                        this.comment();
                    }
                }else {
                    this.next();
                }
            }
            while (!this.eof && this.ch == "*"){
                this.next();
            }
            if (this.eof || this.ch == ")"){
                break;
            }
        }
        if(!this.eof){
            this.next();
        }else{
            this.mark("unclosed comment")
        }
    };

    this._get = function () {
        var sym = null;
        switch (this.ch){
            case "(":
                if (this.next() == "*"){
                    this.comment();
                    sym = this.EMPTY;
                } else {
                    sym = this.LPAREN;
                }
                break;
            case " ":
                    sym = this.SEPARATOR;
                    this.next();
                    break;
            default:
                this.mark("unhandled '", this.ch, "'")
        }
        should.exist(sym);
        return sym;
    };
    
    this.get = function () {
        var sym = null;
        for(var stop = this.eof; !stop;){
            sym = this._get();
            stop = _.isEqual(sym.type, "SYM") || this.eof;
        }
        should.exist(sym);
        return sym;
    }
    this.next();
}

module.exports = function (stream) {
    return new Scanner(stream)
};
