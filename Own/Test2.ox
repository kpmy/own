<?xml version="1.0" encoding="UTF-8"?><unit name="Test2" xmlns:ot="urn:kpmy:ot"><variable name="bool" type="BOOLEAN"/><variable name="int" type="INTEGER"/><variable name="any" type="ANY"/><variable name="a0" type="ANY"/><variable name="a1" type="ANY"/><variable name="str" type="STRING"/><variable name="ch" type="CHAR"/><variable name="ch0" type="CHAR"/><variable name="map" type="MAP"/><variable name="map0" type="MAP"/><variable name="list" type="LIST"/><variable name="proc" type="BLOCK"/><variable name="call" type="BLOCK"/><variable name="callList" type="LIST"/><block name="Do0" exported="false" infix="false"><variable name="x" type="INTEGER" param="reference" order="0"/><sequence><assign><expression><constant-expression type="INTEGER">1933</constant-expression></expression><selector module="Test2" name="x" block="Do0"></selector></assign></sequence></block><start><assign><expression><constant-expression type="BOOLEAN">true</constant-expression></expression><selector module="Test2" name="bool"></selector></assign><assign><expression><constant-expression type="INTEGER">140</constant-expression></expression><selector module="Test2" name="int"></selector></assign><assign><expression><select-expression><selector module="Test2" name="int"></selector></select-expression></expression><selector module="Test2" name="any"></selector></assign><assign><expression><constant-expression type="STRING">Hello, World!</constant-expression></expression><selector module="Test2" name="str"></selector></assign><assign><expression><constant-expression type="CHAR">!</constant-expression></expression><selector module="Test2" name="ch"></selector></assign><assign><expression><constant-expression type="MAP"><key><constant-expression type="STRING">hello</constant-expression></key><value><constant-expression type="STRING">world</constant-expression></value><key><constant-expression type="STRING">hi</constant-expression></key><value><constant-expression type="INTEGER">1</constant-expression></value><key><constant-expression type="STRING">bye</constant-expression></key><value><select-expression><selector module="Test2" name="int"></selector></select-expression></value></constant-expression></expression><selector module="Test2" name="map"></selector></assign><assign><expression><constant-expression type="LIST"><item><constant-expression type="STRING">hello</constant-expression></item><item><constant-expression type="STRING">world</constant-expression></item><item><constant-expression type="STRING">hi</constant-expression></item><item><constant-expression type="INTEGER">1</constant-expression></item><item><constant-expression type="STRING">bye</constant-expression></item><item><select-expression><selector module="Test2" name="int"></selector></select-expression></item></constant-expression></expression><selector module="Test2" name="list"></selector></assign><assign><expression><select-expression><selector module="Test2" name="str"><constant-expression type="INTEGER">0</constant-expression></selector></select-expression></expression><selector module="Test2" name="ch0"></selector></assign><assign><expression><select-expression><selector module="Test2" name="str"><constant-expression type="INTEGER">1</constant-expression></selector></select-expression></expression><selector module="Test2" name="str"><constant-expression type="INTEGER">0</constant-expression></selector></assign><assign><expression><select-expression><selector module="Test2" name="list"><constant-expression type="INTEGER">4</constant-expression></selector></select-expression></expression><selector module="Test2" name="a0"></selector></assign><assign><expression><select-expression><selector module="Test2" name="a0"></selector></select-expression></expression><selector module="Test2" name="list"><constant-expression type="INTEGER">0</constant-expression></selector></assign><assign><expression><select-expression><selector module="Test2" name="map"><constant-expression type="STRING">hi</constant-expression></selector></select-expression></expression><selector module="Test2" name="a1"></selector></assign><assign><expression><select-expression><selector module="Test2" name="int"></selector></select-expression></expression><selector module="Test2" name="map"><constant-expression type="STRING">bye</constant-expression></selector></assign><assign><expression><constant-expression type="MAP"><key><constant-expression type="STRING">list</constant-expression></key><value><constant-expression type="LIST"><item><constant-expression type="INTEGER">0</constant-expression></item><item><constant-expression type="INTEGER">1</constant-expression></item><item><constant-expression type="INTEGER">2</constant-expression></item><item><constant-expression type="INTEGER">3</constant-expression></item></constant-expression></value></constant-expression></expression><selector module="Test2" name="map0"></selector></assign><assign><expression><constant-expression type="BLOCK">Test2.Do0</constant-expression></expression><selector module="Test2" name="proc"></selector></assign><call><selector module="Test2" name="proc"></selector></call><assign><expression><select-expression><selector module="Test2" name="proc"></selector></select-expression></expression><selector module="Test2" name="call"></selector></assign><call><selector module="Test2" name="call"><select-expression><selector module="Test2" name="int"></selector></select-expression><constant-expression type="INTEGER">2</constant-expression><constant-expression type="INTEGER">3</constant-expression></selector></call><call><selector module="Test2" name="proc"></selector></call><assign><expression><constant-expression type="LIST"><item><select-expression><selector module="Test2" name="proc"></selector></select-expression></item><item><select-expression><selector module="Test2" name="call"></selector></select-expression></item><item><constant-expression type="BLOCK">Test2.Do0</constant-expression></item></constant-expression></expression><selector module="Test2" name="callList"></selector></assign><assign><expression><constant-expression type="ANY">NONE</constant-expression></expression><selector module="Test2" name="proc"></selector></assign></start></unit>