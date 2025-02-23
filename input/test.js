// input.js
const VERSION = '1.0'
const VERSION2 = VERSION + 2
const map = {
  0: '12',
  1: '34',
  a: '56',
  b: {
    c: 'ccc',
    d: {
      e: 3,
    },
  },
}

function createHelper() {
  return {
    log: () => console.log('Helper created'),
  }
}

function add() {
  console.log('add')
  add2()
}

function add2() {
  console.log('add2')
  const v = map.a
  console.log('map', v)
}

class Logger {
  static instance = createHelper()

  static log(message) {
    const prefix = `[${VERSION}]` // 需要提取 VERSION
    console.log(`${prefix} ${message} ${VERSION2}`)
  }

  constructor(version = VERSION) {
    this.version = version
  }

  sayHello() {
    console.log('hello', this.version, map.b.d.e)
  }
}

function mainFunction() {
  Logger.log('Running main')
  add()
  const helper = createHelper() // 需要提取 createHelper
  helper.log()
  // const log = new Logger()
  // log.sayHello()
}
