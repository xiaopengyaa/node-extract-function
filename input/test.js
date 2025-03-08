// 传统构造函数写法
// var a = 1
var a = 2
var obj = {
  Person: {},
}
function b() {
  console.log('b')
}
a = 10
function Person(name) {
  this.name = name
}

modifyA()

function modifyA() {
  a = 3
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
    b()
    console.log(`${this.grade} is grade`)
    console.log(`${this.name + a + this.age} is studying`)
    console.log(`${this.score} is _score`)
    console.log(`${this.person} is _person`)
  }

  static getSchool() {
    return 'ABC School'
  }
}

Student.prototype.stu = 'stu'

// 使用 Object.defineProperty
Object.defineProperty(Student.prototype, 'score', {
  get() {
    return 123
  },
})

// 使用 Object.defineProperty
Object.defineProperty(Person.prototype, 'person', {
  get() {
    return 'person'
  },
})

c()

function c() {
  Person.d = 1
}

var a = 20
