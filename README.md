#Info
---
    Author : chenfeng@xyzq.com.cn
    Date   : 2018-5-7

#General purpose
---
    Tiscript is a Javascript++(1.x) and without browser specified apis supported desktop ui engine based script.
    It's imposible using javascript libraries in tiscript directly, some are write affixed to browser apis, or using ES6 syntax, 
    or using CMD/AMD/UMD module managment etc. 

    Sciter engine support HTML for rendering UI, it's valuable to transpile numerous javascript libraries for sciter.
    With the powerful javascript libraries transpiled, some work like HTML canvas based chart/draw/flow-engine can be easily done.
    To achive this goal, at least using some libraries like canvas based charts, we need to get rid of some module/ES6 problems.

    Babel is aiming the same goal as transpile script to run in universal browser environments. That's inspired me to dig deeper 
    If there is a way to write a babel plugin for tiscript, using the plugin we can transpile some javascript libraries 
    not affixed to browser apis.Some syntax that only supported in tiscript will handled by magic string replacement(dist/util.js).

    Further more, we can get some ui framework like React/AngularJS work for sciter.

#Babel Transform
---
0. INSTALL npm & cnpm
    https://npmjs.org
    ```
    npm install -g cnpm --registry=https://registry.npm.taobao.org
    ```

1. INSTALL babel-cli  & plugins
    ```
    cnpm install --save-dev babel-cli babel-core babel-preset-env mocha babel-generator
    ```

2. BUILD babel plugin for tiscript..
    ```
    // in babel-plugin-transform-tiscript
    cnpm install
    cnpm run build-test
    ```

3. TRANSLATE Javascript 

    See scripts/README.md for details.

#Sciter/Javascript Transform Notes 
--- 

references : 
    ```
    https://sciter.com/developers/for-web-programmers/tiscript-vs-javascript/
    https://sciter.com/docs/js-dart-tis.html
    ```

0.  Transform ' to "
    Note : 
        Tiscript use '' for charactor just like c/c++
    
    Tranpile : 
        Use StringLiteral to identify and replace ' to ", also use escape
        character for transform " to \" inside the string.

1. Transform import & export to namespace & include 
    Note : 
        Tiscript use namespace & include to implement module scheme instead of Javascript ES6's import/export scheme.
        //transpile CMD/AMD/UMD

    Transpile :
        a. export default [declaration];
           to 
           var sciter_defaultVar [declaration];
        b. export default [declaration];
           to 
           var sciter_defaultVar [declaration];
        c. export * from "foo";
           to 
           include("foo.tis");

    SEE test/src/export/*.js for full details.

2. Transpile Sciter's type comparasion is different with javascript.
    Tranpile : 
        typeof process !== 'function' --> typeof process !== #function
        typeof process === 'function' --> typeof process === #function
        typeof process !== 'object'  --> typeof process !== #object
        typeof process !== 'undefined' --> typeof process !== undefined
        ostring.call(it) === '[object Function]' --> ostring.call(it) === #function 

3. TRANSFORM Javascript & DOM object to sciter implementation.
    a) document
        document -> undefined/self
        document.querySelector -> self.select
        document.getElementById -> self.select
        document.querySelectorAll-> self.selectAll
        document.getElementByTagName -> self.selectAll
        document.getElementByClassName -> self.selectAll

        //TODO $(document).ready(function () {xxx})  -> function self.ready

    b) element
        elem.innerHTML -> elem.html
        elem.firstChild -> elem[0]
        elem.appendChild -> elem.append
        elem.getAttribute -> element.attributes['']
        elem.setAttribute -> element.attributes[''] = 
        elem.hasAttribute -> element.attributes[''] !== undefined
        elem.removeAttribute -> element.attributes[''] = undefined
        elem.hasChildNodes -> elem.length > 0
        element.addEventListener('click', handleOnClick, false) -> element.onClick = handleOnClick

        document.createElement -> new Element

    c) setTimeout
        setTimeout(function..., 500) -> element.timer(500, function...);

        self.timer(500, function() {
        });

    d) console
        console.log -> stdout.println

    e) string.startsWith
        'xxx'.startsWith -> 'xxx'.indexOf

    f) window, navigator, screen, history, location, wx, browser -> {}
       document -> undefined

4. Sciter need parenthesizedExpression for binaryExpression or logicalExpression
    Transpile : 
        a in b  -> (a in b)
        a == b  -> (a == b)
        a != b  -> (a != b)
        a && b  -> (a && b)
        a || b  -> (a || b)

5. Sciter need blockExpression for SwichCase statement.
    Transpile : 
        case 'xxx': 
            var aa = bb;
            break;

        ->

        case 'xxx': {
            var aa = bb;
            break;
        }

6. Sciter doesn't suppor void 0 opt.
   Transpile:
        void 0 -> void(0)
        void 'hello' -> void('hello')

7. Sciter have a larger keywords than Javascript
   Transpile:
        https://sciter.com/docs/content/script/language/Syntax.htm Keywords
        Here is a full list of keywords used by the language. These cannot be used as identifiers:
        function,   var,      if,       else,     while,     return,   for,
        break,      continue, do,       switch,   case,      default,  null,
        super,      new,      try,      catch,    finally,   throw,    typeof,
        instanceof, in,       property, const,    get,       set,      include,
        like,       yield,    type,     class,    namespace, assert,   debug
        otherwise
    
        assert() -> sciter_assert()

8. Sciter isn't support for using undefined object in statement directly.
    Error : Float32Array Variable not found  
    
    So Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array need transpile as reservedKeywords.

    Transpile : 
        if (typeof Float32Array == undefined) {
            ...
        }

        ->
        var Float32Array = undefined;
        if (typeof Float32Array == undefined) {
            ...
        }


9. Sciter support buildt-in class syntax.
    Transpile :  
        function Person(name) {
            this.name = name;
        }

        Person.prototype.greet = function() {
            return 'Hello, ' + this.name;
        }

        function Employee(name, salary) {
            Person.call(this, name);
            this.salary = salary;
        }

        Employee.prototype = new Person();
        Employee.prototype.constructor = Employee;

        Employee.prototype.grantRaise = function(percent){
            this.salary = (this.salary * percent).toInt();
        }

        ->
        class Person {
            function this(name) { this.name = name; }

            function greet() {
                return 'Hello, ' + this.name;
            }
        }

        class Employee: Person {

            function this(name, salary) {
                super(name); // call of ctor of super class
                this.salary = salary;
            }

            function grantRaise(percent) {
                this.salary = (this.salary * percent).toInteger();
            }
        }

10. Sciter didn't have hasOwnProperty method
    Error example : 
        test.hasOwnProperty(key);
        Class (Class([object Class])) has no method - hasOwnProperty

    Transpile:
        test.key != null

10. Sciter doesn't support variable number of arguments by default syntax.
    // If last parameter is marked by '..'
    // then it will take array of values passed: 

    function superHeroes(msg, heroes..) {
        for (var hero in heroes)
            stdout.println(msg, hero);
    }

11. Sciter isn't support label(goto) like for/while loop jump. (working)

    Error example :
        Error: bad syntax : Expecting '<identifier>', found 'for'

        foo : for () {
            break foo;
        }

    Transpile : 

12. Sciter doesn't support ',' statement.

        
