<?xml version="1.0" encoding="UTF-8"?><unit name="Test" xmlns:ot="urn:kpmy:ot"><variable name="i" type="INTEGER"/><variable name="j" type="INTEGER"/><variable name="p" type="BOOLEAN"/><variable name="q" type="BOOLEAN"/><variable name="x" type="ANY"/><variable name="list" type="LIST"/><block name="Init" exported="false" infix="false"><sequence><assign><expression><constant-expression type="INTEGER">32</constant-expression></expression><selector module="Test" name="i"></selector></assign><assign><expression><constant-expression type="INTEGER">232</constant-expression></expression><selector module="Test" name="j"></selector></assign><assign><expression><select-expression><selector module="Test" name="i"></selector></select-expression></expression><selector module="Test" name="j"></selector></assign><assign><expression><constant-expression type="BOOLEAN">true</constant-expression></expression><selector module="Test" name="p"></selector></assign><assign><expression><constant-expression type="BOOLEAN">false</constant-expression></expression><selector module="Test" name="q"></selector></assign><assign><expression><select-expression><selector module="Test" name="p"></selector></select-expression></expression><selector module="Test" name="q"></selector></assign><assign><expression><select-expression><selector module="Test" name="i"></selector></select-expression></expression><selector module="Test" name="x"></selector></assign><assign><expression><constant-expression type="INTEGER">400</constant-expression></expression><selector module="Test" name="x"></selector></assign><assign><expression><select-expression><selector module="Test" name="x"><deref-expression/></selector></select-expression></expression><selector module="Test" name="i"></selector></assign><assign><expression><constant-expression type="BOOLEAN">true</constant-expression></expression><selector module="Test" name="x"></selector></assign><assign><expression><constant-expression type="ANY">NONE</constant-expression></expression><selector module="Test" name="x"></selector></assign><assign><expression><constant-expression type="LIST"><item><constant-expression type="INTEGER">1</constant-expression></item><item><constant-expression type="INTEGER">2</constant-expression></item><item><constant-expression type="INTEGER">3</constant-expression></item></constant-expression></expression><selector module="Test" name="list"></selector></assign><assign><expression><select-expression><selector module="Test" name="list"><constant-expression type="INTEGER">0</constant-expression><deref-expression/></selector></select-expression></expression><selector module="Test" name="j"></selector></assign><assign><expression><constant-expression type="LIST"><item><constant-expression type="LIST"><item><constant-expression type="INTEGER">1</constant-expression></item><item><constant-expression type="INTEGER">2</constant-expression></item><item><constant-expression type="INTEGER">3</constant-expression></item></constant-expression></item><item><constant-expression type="LIST"><item><constant-expression type="INTEGER">4</constant-expression></item><item><constant-expression type="INTEGER">5</constant-expression></item><item><constant-expression type="INTEGER">6</constant-expression></item></constant-expression></item></constant-expression></expression><selector module="Test" name="list"></selector></assign><assign><expression><select-expression><selector module="Test" name="list"><constant-expression type="INTEGER">1</constant-expression><deref-expression/><dot-expression/><constant-expression type="INTEGER">2</constant-expression><deref-expression/></selector></select-expression></expression><selector module="Test" name="j"></selector></assign></sequence></block><start><call><expression><call-expression module="Test" name="Init"></call-expression></expression></call></start></unit>