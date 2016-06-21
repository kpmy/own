/* Created by kpmy on 10.05.2016 */
const should = require("should");
const _ = require('underscore');
const charfunk = require("./vendor/charFunk-1.1.2.min.js");

function Sym(type) {
    this.type = "SYM";
    this.code = null;

    if (type)
        this["type"] = type;
}

function thisSym(code) {
    var ret = new Sym();
    ret.code = code;
    return ret;
}

function isLetter(ch) {
    if (ch) {
        return charfunk.isLetter(ch.charAt(0));
    } else {
        return false;
    }
}

function isNum(ch) {
    if (ch) {
        return charfunk.isDigit(ch.charAt(0));
    } else {
        return false;
    }
}

function Scanner(source) {
    const s = this;

    s.EOF = new Sym("EOF");
    s.START = new Sym("START"); //dumb sym
    s.EMPTY = new Sym("EMPTY");
    s.LPAREN = thisSym("(");
    s.RPAREN = thisSym(")");
    s.LBRUX = thisSym("<<");
    s.RBRUX = thisSym(">>");
    s.LBRACE = thisSym("{");
    s.RBRACE = thisSym("}");
    s.SEPARATOR = thisSym("¶");
    s.SEMICOLON = thisSym(";");
    s.DELIMITER = thisSym("` `");
    s.IDENT = thisSym("IDENT");
    s.STR = thisSym("STR");
    s.NUM = thisSym("NUM");
    s.ASSIGN = thisSym("->");
    s.MINUS = thisSym("-");
    s.PLUS = thisSym("+");
    s.COMMA = thisSym(",");
    s.DOT = thisSym(".");
    s.LBRAK = thisSym("[");
    s.RBRAK = thisSym("]");
    s.TIMES = thisSym("*");
    s.CIRC = thisSym("^");
    s.COLON = thisSym(":");
    s.BRICK = thisSym("::");
    s.DOLLAR = thisSym("$");
    s.PIPE = thisSym("|");
    s.AMP = thisSym("&");
    s.TILD = thisSym("~");
    s.EQL = thisSym("=");
    s.NEQ = thisSym("#");
    s.LSS = thisSym("<");
    s.GTR = thisSym(">");
    s.LEQ = thisSym("<=");
    s.GEQ = thisSym(">=");
    s.FIX = thisSym("\\");
    s.DOG = thisSym("@");

    this["keyTab"] = {
        "UNIT": s.UNIT = thisSym("UNIT"),
        "END": s.END = thisSym("END"),
        "IMPORT": s.IMPORT = thisSym("IMPORT"),
        "START": s.START = thisSym("START"),
        "STOP": s.STOP = thisSym("STOP"),
        "VAR": s.VAR = thisSym("VAR"),
        "BLOCK": s.BLOCK = thisSym("BLOCK"),
        "BEGIN": s.BEGIN = thisSym("BEGIN"),
        "PAR": s.PAR = thisSym("PAR"),
        "INFIX": s.INFIX = thisSym("INFIX"),
        "CONST": s.CONST = thisSym("CONST"),
        "NONE": s.NONE = thisSym("NONE"),
        "TRUE": s.TRUE = thisSym("TRUE"),
        "FALSE": s.FALSE = thisSym("FALSE"),
        "NIL": s.NIL = thisSym("NIL"),
        "TYPE": s.TYPE = thisSym("TYPE"),
        "IF": s.IF = thisSym("IF"),
        "THEN": s.THEN = thisSym("THEN"),
        "ELSE": s.ELSE = thisSym("ELSE"),
        "ELSIF": s.ELSIF = thisSym("ELSIF"),
        "WHILE": s.WHILE = thisSym("WHILE"),
        "DO": s.DO = thisSym("DO"),
        "REPEAT": s.REPEAT = thisSym("REPEAT"),
        "UNTIL": s.UNTIL = thisSym("UNTIL"),
        "IS": s.IS = thisSym("IS"),
        "CHOOSE": s.CHOOSE = thisSym("CHOOSE"),
        "OF": s.OF = thisSym("OF"),
        "AS": s.AS = thisSym("AS"),
        "OR": s.OR = thisSym("OR"),
        "PRE": s.PRE = thisSym("PRE"),
        "POST": s.POST = thisSym("POST")
    };

    this["eof"] = false;
    this.strict = false;
    this["pos"] = 0;
    this["ch"] = null;
    this["lines"] = {
        count: 0,
        last: 0,
        crlf: false,
        line: function () {
            if (s.ch == '\r') {
                s.lines.crlf = true;
            }
            if ((s.lines.crlf && s.ch == '\r') || (!s.lines.crlf && s.ch == '\n')) {
                s.lines.count++;
                s.lines.last = 1
            } else if (s.lines.crlf && s.ch == '\n') {
                s.lines.last--;
            }
        }
    };

    this.thisLine = function () {
        return [this.lines.count, this.lines.last];
    };

    this.mark = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.push(" at pos " + s.pos);
        args.push(" at line " + s.thisLine());
        console.log(args.join(""));
        throw new Error(args.join(""));
    };

    this.futureMark = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.push(" at pos " + s.pos);
        args.push(" at line " + s.thisLine());
        return function () {
            console.log(args.join(""));
            throw new Error(args.join(""));
        }
    };

    this.next = function () {
        var c = source.charAt(this.pos);
        if (c) {
            this.pos++;
            this.ch = c;
            //console.log(c);
            if (this.ch == '\r' || this.ch == '\n') {
                this.lines.line();
            } else {
                this.lines.last++;
            }
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
        for (; ;) {
            while (!this.eof && this.ch != "*") {
                if (this.ch == "(") {
                    if (this.next() == "*") {
                        this.comment();
                    }
                } else {
                    this.next();
                }
            }
            while (!this.eof && this.ch == "*") {
                this.next();
            }
            if (this.eof || this.ch == ")") {
                break;
            }
        }
        if (!this.eof) {
            this.next();
        } else {
            this.mark("unclosed comment")
        }
    };

    this.ident = function () {
        should.ok(isLetter(this.ch));
        var sym = null;
        var buf = "";
        for (; ;) {
            buf = buf + this.ch;
            this.next();
            if (this.eof || !(isLetter(this.ch) || isNum(this.ch))) {
                break;
            }
        }
        if (!this.eof || !(_.isEmpty(buf))) {
            if (!s.strict && this.keyTab.hasOwnProperty(buf)) {
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

        for (; ;) {
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
        if (mods.indexOf(this.ch) >= 0) {
            mbuf = this.ch;
            if (!this.eof) this.next();
        }
        if (!this.eof || !_.isEmpty(buf)) {
            sym = thisSym("NUM");
            sym.value = buf;
            sym.modifier = mbuf;
            sym.dot = hasDot;
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
        sym.value = "";
        this.next();
        while (!this.eof && !_.isEqual(this.ch, end)) {
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
        switch (this.ch) {
            case "-":
                if (this.next() == ">") {
                    this.next();
                    sym = this.ASSIGN;
                } else {
                    sym = this.MINUS;
                }
                break;
            case "(":
                if (this.next() == "*") {
                    this.comment();
                    sym = this.EMPTY;
                } else {
                    sym = this.LPAREN;
                }
                break;
            case ")":
                this.next();
                sym = this.RPAREN;
                break;
            case "[":
                this.next();
                sym = this.LBRAK;
                break;
            case "]":
                this.next();
                sym = this.RBRAK;
                break;
            case "{":
                this.next();
                sym = this.LBRACE;
                break;
            case "}":
                this.next();
                sym = this.RBRACE;
                break;
            case "<":
                var n = this.next();
                if (n == "<") {
                    sym = this.LBRUX;
                    this.next();
                } else if (n == "=") {
                    sym = this.LEQ;
                    this.next();
                } else {
                    sym = this.LSS;
                }
                break;
            case ">":
                var n = this.next();
                if (n == ">") {
                    sym = this.RBRUX;
                    this.next();
                } else if (n == "=") {
                    sym = this.GEQ;
                    this.next();
                } else {
                    sym = this.GTR;
                }
                break;
            case "@":
                this.next();
                sym = this.DOG;
                break;
            case ",":
                this.next();
                sym = this.COMMA;
                break;
            case "$":
                this.next();
                sym = this.DOLLAR;
                break;
            case "\\":
                this.next();
                sym = this.FIX;
                break;
            case ".":
                this.next();
                sym = this.DOT;
                break;
            case "*":
                this.next();
                sym = this.TIMES;
                break;
            case "^":
                this.next();
                sym = this.CIRC;
                break;
            case ":":
                if (this.next() == ":"){
                    sym = this.BRICK;
                    this.next();
                } else {
                    sym = this.COLON;
                }
                break;
            case "+":
                this.next();
                sym = this.PLUS;
                break;
            case "|":
                this.next();
                sym = this.PIPE;
                break;
            case "&":
                this.next();
                sym = this.AMP;
                break;
            case "~":
                this.next();
                sym = this.TILD;
                break;
            case "#":
                this.next();
                sym = this.NEQ;
                break;
            case "=":
                this.next();
                sym = this.EQL;
                break;
            case " ":
            case "\t":
                sym = this.DELIMITER;
                while (_.isEqual(this.ch, " ") || _.isEqual(this.ch, "\t")) {
                    this.next();
                }
                break;
            case "\r":
            case "\n":
                sym = this.SEPARATOR;
                while (_.isEqual(this.ch, "\r") || _.isEqual(this.ch, "\n") || (!this.strict && _.isEqual(this.ch, ";"))) {
                    this.next();
                }
                break;
            case ";":
                if(this.strict)
                    sym = this.SEMICOLON;
                else
                    sym = this.SEPARATOR;
                this.next();
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
                if (isLetter(this.ch)) {
                    sym = this.ident();
                } else if (isNum(this.ch)) {
                    sym = this.num();
                } else {
                    this.mark("unhandled '", this.ch, "'")
                }
        }
        should.exist(sym);
        return sym;
    };

    this.get = function () {
        if (this.eof) return this.EOF;

        var sym = null;
        for (var stop = this.eof; !stop;) {
            sym = this._get();
            stop = _.isEqual(sym.type, "SYM") || this.eof;
        }
        should.exist(sym);
        return sym;
    };
    this.lines.count++;
    this.next(); //important initial read
}

module.exports = function (source) {
    return new Scanner(source)
};
