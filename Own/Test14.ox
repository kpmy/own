<?xml version="1.0" encoding="UTF-8"?><unit name="Test14" xmlns:ot="urn:kpmy:ot"><import name="Console"/><variable name="file" type="MAP"/><variable name="x" type="INTEGER"/><variable name="proc" type="BLOCK"/><block name="Do" exported="false" infix="false"><sequence><assign><expression><constant-expression type="INTEGER">10</constant-expression></expression><selector module="Test14" name="x"></selector></assign></sequence></block><start><assign><expression><constant-expression type="MAP"><key><constant-expression type="STRING">name</constant-expression></key><value><constant-expression type="STRING">Test14</constant-expression></value><key><constant-expression type="ATOM" structured="false">ext</constant-expression></key><value><constant-expression type="STRING">ow</constant-expression></value><key><constant-expression type="ATOM" structured="false">doit</constant-expression></key><value><constant-expression type="ANY">NONE</constant-expression></value></constant-expression></expression><selector module="Test14" name="file"></selector></assign><call><expression><call-expression module="Console" name="Print"><parameter><select-expression><selector module="Test14" name="file"></selector></select-expression></parameter></call-expression></expression></call><call><expression><call-expression module="Console" name="Print"><parameter><select-expression><selector module="Test14" name="file"><constant-expression type="STRING">name</constant-expression></selector></select-expression></parameter><parameter><select-expression><selector module="Test14" name="file"><constant-expression type="ATOM" structured="false">ext</constant-expression></selector></select-expression></parameter></call-expression></expression></call><assign><expression><constant-expression type="STRING">og</constant-expression></expression><selector module="Test14" name="file"><dot-expression>ext</dot-expression></selector></assign><call><expression><call-expression module="Console" name="Print"><parameter><select-expression><selector module="Test14" name="file"><constant-expression type="STRING">name</constant-expression></selector></select-expression></parameter><parameter><select-expression><selector module="Test14" name="file"><dot-expression>ext</dot-expression></selector></select-expression></parameter></call-expression></expression></call><assign><expression><constant-expression type="BLOCK">Test14.Do</constant-expression></expression><selector module="Test14" name="file"><dot-expression>doit</dot-expression></selector></assign><assign><expression><select-expression><selector module="Test14" name="file"><dot-expression>doit</dot-expression><cast-expression><constant-expression type="TYPE">BLOCK</constant-expression></cast-expression></selector></select-expression></expression><selector module="Test14" name="proc"></selector></assign><call><selector module="Test14" name="proc"></selector></call><call><expression><call-expression module="Console" name="Print"><parameter><select-expression><selector module="Test14" name="x"></selector></select-expression></parameter></call-expression></expression></call></start></unit>