// 传统构造函数写法
// var a = 1
// var a = 2
var obj = {
  Person: {},
}
function Person(name) {
  this.name = name
}

Person.prototype.sayHello = function () {
  console.log(`Hello, I'm ${this.name}`)
}

Person.age = 21
Person.prototype.age = 7
obj.Person.age = 18

// ES6 类写法
class Student extends Person {
  constructor(name, grade) {
    var a = 10
    super(name)
    this.grade = grade
  }

  study() {
    console.log(`${this.name + a} is studying`)
    console.log(`${this.score} is _score`)
  }

  static getSchool() {
    return 'ABC School'
  }
}

// 使用 Object.defineProperty
Object.defineProperty(Student.prototype, 'score', {
  get() {
    return a
  },
})

var a = 20
