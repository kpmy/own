<?xml version="1.0" encoding="UTF-8"?><unit name="Test0" xmlns:ot="urn:kpmy:ot"><import name="Log"/><variable name="i" type="INTEGER" modifier="rw"/><variable name="j" type="INTEGER" modifier="rw"/><block name="Do" exported="true" infix="false"><sequence><assign><expression><constant-expression type="INTEGER">1</constant-expression></expression><selector module="Test0" name="j"></selector></assign></sequence></block><block name="Do0" exported="true" infix="false"><variable name="i" type="INTEGER" param="reference" order="0"/><sequence><assign><expression><constant-expression type="INTEGER">3423</constant-expression></expression><selector module="Test0" name="i" block="Do0"></selector></assign></sequence></block></unit>