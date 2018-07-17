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
Employee.prototype.flag = true;
Employee.prototype.str  = "test string";

Employee.prototype.grantRaise = function(percent){
    this.salary = (this.salary * percent).toInt();
}

export default Person;
