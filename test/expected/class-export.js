
class Person {
    function this(name) {
        this.name = name;
    }

    function greet() {
        return "Hello, " + this.name;
    }

}

class Employee : Person {
    function this(name, salary) {
        Person.call(this, name);
        this.salary = salary;
    }

    this var flag = true;
    this var str = "test string";

    function grantRaise(percent) {
        this.salary = (this.salary * percent).toInt();
    }

}

var sciter_default = Person;
