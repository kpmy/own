# Прогресс и TODO

## TODO

* [ ] метаинформация для всего подряд на базе o.t.
* [ ] тип REAL (возможно на базе unum)
* [ ] тип RANGE (возможно на базе конструктора типов)
* [ ] пользовательские типы (онтология!)
* [ ] конверсия типов
* [ ] проверка совместимости типов в операциях
* [ ] передача именованых параметров для процедур
* [ ] методы для пользовательских типов
* [ ] инструкция PROCESS для декларативного программирования
* [ ] регистровые переменные
* [ ] глобальный импорт модуля (IMPORT Log -> *) с последующей возможностью вызова процедур из него (String, Ln)
* [x] предусловия, постусловия для процедур, ассерты в стандартной библиотеке
* [x] атомы
* [x] инструкции IF, WHILE, REPEAT, CHOOSE
* [x] паттерн-матчинг для CHOOSE
* [x] указатели
* [x] проверка типа IS
* [x] константы
* [x] тип SET
* [x] короткий селектор через точечку, в т.ч. по атому.
* [x] приведение типов

## Прогресс

### Модульность
Реализованы модули, процедуры, импорты, импортированные процедуры, локальные переменные процедуры, глобальные переменные модуля, импортированные переменные.
Контроль доступа к экспорированным процедурам и переменным, стандартный модуль.

### Типы данных
Реализованы BOOLEAN, INTEGER, STRING, CHAR, LIST, MAP, SET, TYPE, BLOCK, POINTER литералы для них, так же некоторый операции для типов BOOLEAN и INTEGER. Реализован механизм пользовательских типов (пока на уровне синтаксиса).

### Управление потоком исполнения
Пока реализованы вызовы процедур. Реализован инфиксный вызов. Так же реализована передача параметров по ссылке и по значению. Добавлены IF, WHILE, REPEAT, CHOOSE

### Стандартный модуль
INC, DEC, ORD, TYPEOF, ASSERT, NEW

### Компилятор
Разбор текста, генерация AST, экспорт/~~импорт~~ AST, экспорт/импорт def-файла, генерация js.

### Рантайм
Динамическая загрузка модулей, управление объектами и типами, рантайм-калькулятор для арифметики на базе eval, стандартный модуль, всё на базе node js.
