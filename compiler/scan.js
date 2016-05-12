/**
 * Created by petry_000 on 10.05.2016.
 */
const should = require("should/as-function");
const _ = require('underscore');
const charfunk = require("charfunk");

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

function isLetter(ch) {
    if(ch){
        return charfunk.isLetter(ch.charAt(0));
    } else {
        return false;
    }
}

function isNum(ch) {
    if(ch){
        return charfunk.isDigit(ch.charAt(0));
    } else {
        return false;
    }
}

function Scanner(stream) {
    this.EOF = new Sym("EOF");
    this.START = new Sym("START"); //dumb sym
    this.EMPTY = new Sym("EMPTY");
    this.LPAREN = thisSym("(");
    this.SEPARATOR = thisSym(";");
    this.DELIMITER = thisSym("` `");
    this.IDENT = thisSym("IDENT");
    this.STR = thisSym("STR");
    this.NUM = thisSym("NUM");
    
    this["keyTab"] = {
        "UNIT": thisSym("UNIT"),
        "END": thisSym("END")
    };
    this.UNIT = this.keyTab["UNIT"];
    this.END = this.keyTab["END"];
    
    this["stream"] = stream;
    this["eof"] = false;
    this["pos"] = 0;
    this["ch"] = null;

    this.mark = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.push(" at pos "+this.pos);
        throw new Error(args.join(""));
    };

    this.next = function () {
        var c = this.stream.read(1);
        if(c) {
            this.pos++;
            this.ch = c;
            //console.log(c);
            return c;
        } else {
            should.ok(!this.eof);
            this.eof = true;
            this.ch = "";
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

    this.ident = function () {
        should.ok(isLetter(this.ch));
        var sym = null;
        var buf = "";
        for(;;){
            buf = buf + this.ch;
            this.next();
            if (this.eof || !(isLetter(this.ch) || isNum(this.ch))){
                break;
            }
        }
        if (!this.eof || !(_.isEmpty(buf))){
            if (this.keyTab.hasOwnProperty(buf)){
                sym = this.keyTab[buf];
            } else {
                sym = thisSym("IDENT");
                sym.value = buf;
            }
        } else {
            sym = this.EOF;
        }
        return sym;
    };

    this.num = function () {
        const hex = "ABCDEF";
        const mods = "U";
        should.ok(isNum(this.ch));
        var sym = null;
        var buf = "";
        var mbuf = "";
        var hasDot = false;

        for(;;) {
            buf = buf + this.ch;
            this.next();
            if (_.isEqual(this.ch, ".")) {
                if (!hasDot)
                    hasDot = true;
                else if (hasDot)
                    this.mark("unexpected dot");
            }
            if (this.eof || !(_.isEqual(this.ch, ".") || (hex.indexOf(this.ch) >= 0) || isNum(this.ch))) {
                break;
            }
        }
        if(mods.indexOf(this.ch)>=0){
            mbuf = this.ch;
            if (!this.eof) this.next();
        }
        if(!this.eof || !_.isEmpty(buf)){
            sym = thisSym("NUM");
            sym.value = buf;
            sym.modifier = mbuf;
            sym.period = hasDot;
        } else {
            sym = this.EOF;
        }
        return sym;
    };

    this.str = function () {
        should.ok(_.isEqual(this.ch, "'") || _.isEqual(this.ch, '"') || _.isEqual(this.ch, '`'));
        const end = this.ch;
        var sym = thisSym("STR");
        sym.apos = !_.isEqual(this.ch, '"');
        this.next();
        while(!this.eof && !_.isEqual(this.ch, end)){
            sym.value = sym.value + this.ch;
            this.next();
        }
        if (!this.eof)
            this.next();
        else
            this.mark("string expected");
        return sym;
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
            case "\t":
                    sym = this.DELIMITER;
                    while(_.isEqual(this.ch, " ") || _.isEqual(this.ch, "\t")){
                        this.next();
                    }
                    break;
            case "\r":
            case "\n":
            case ";":
                sym = this.SEPARATOR;
                while(_.isEqual(this.ch, "\r") || _.isEqual(this.ch, "\n") || _.isEqual(this.ch, ";")){
                    this.next();
                }
                break;
            case "'":
            case '"':
            case '`':
                sym = this.str();
                break;
            case "":
                    sym = this.EOF;
                    break;
            default:
                if(isLetter(this.ch)){
                    sym = this.ident();
                }else if (isNum(this.ch)){
                    sym = this.num();
                }else {
                    this.mark("unhandled '", this.ch, "'")
                }
        }
        should.exist(sym);
        return sym;
    };
    
    this.get = function () {
        if (this.eof) return this.EOF;

        var sym = null;
        for(var stop = this.eof; !stop;){
            sym = this._get();
            stop = _.isEqual(sym.type, "SYM") || this.eof;
        }
        should.exist(sym);
        return sym;
    };

    this.next(); //important initial read
}

module.exports = function (stream) {
    return new Scanner(stream)
};
