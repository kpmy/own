<?xml version="1.0" encoding="UTF-8"?><unit name="Test7" xmlns:ot="urn:kpmy:ot"><variable name="i" type="INTEGER"/><variable name="proc" type="BLOCK"/><start><call><expression><call-expression module="$std" name="INC"><parameter><select-expression><selector module="Test7" name="i"></selector></select-expression></parameter></call-expression></expression></call><call><expression><call-expression module="$std" name="INC"><parameter><select-expression><selector module="Test7" name="i"></selector></select-expression></parameter></call-expression></expression></call><call><expression><call-expression module="$std" name="INC"><parameter><select-expression><selector module="Test7" name="i"></selector></select-expression></parameter></call-expression></expression></call><call><expression><call-expression module="$std" name="DEC"><parameter><select-expression><selector module="Test7" name="i"></selector></select-expression></parameter></call-expression></expression></call><assign><expression><constant-expression type="BLOCK">$std.INC</constant-expression></expression><selector module="Test7" name="proc"></selector></assign><call><selector module="Test7" name="proc"><select-expression><selector module="Test7" name="i"></selector></select-expression></selector></call></start></unit>