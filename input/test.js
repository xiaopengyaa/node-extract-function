/* 全局变量区 (12个) */
const MAX_PACKET_SIZE = 1024
var connectionPool = new Map()
let tempBuffer = ''
var protocolVersion = 'HTTP/1.1'
const DEFAULT_TIMEOUT = 30000
var pendingRequests = new Set()
var errorCodes = { 400: 'Bad Request', 500: 'Server Error' }
var isSecure = true
var headerValidators = []
var requestCounter = 0
const ALLOWED_METHODS = ['GET', 'POST']
var tempCache = new WeakMap()

/* 类继承体系 (13个，使用12个) */
class NetworkHandler {
  constructor() {
    this.temp = 'base'
  }
  handle() {
    throw new Error('需实现')
  }
}

class HttpHandler extends NetworkHandler {
  handle(data) {
    const temp = data.slice(0, 10)
    return this._parse(temp)
  }
  _parse() {
    /* ... */
  }
}

class HttpsHandler extends HttpHandler {
  constructor() {
    super()
    this.cipher = 'TLS'
  }
}

class WebSocketHandler extends HttpHandler {
  #handshake() {
    let temp = 123
    return temp.toString()
  }
}

// 中间件类体系
class Middleware {
  apply() {
    /* 抽象方法 */
  }
}

class LoggerMiddleware extends Middleware {
  apply(req) {
    const timestamp = Date.now()
    console.log(`[${{ timestamp }}]  ${{ req }}`)
  }
}

class AuthMiddleware extends LoggerMiddleware {
  #secretKey
  constructor(key) {
    super()
    this.#secretKey = key
  }
}

/* 函数定义 (16个，使用15个) */
function createConnection(endpoint) {
  let connection = {
    id: crypto.randomUUID(),
    status: 'pending',
  }
  connectionPool.set(endpoint, connection)
  return connection
}

const packetValidator = (packet) => {
  const temp = packet.headers ?? {}
  return Object.keys(temp).length > 0
}

function* generateRequestId() {
  while (true) yield `REQ_${requestCounter++}`
}

// 未使用函数 (1个)
function deprecatedParser() {
  console.warn(' 该方法已弃用')
}

// 工厂函数
function createHandler(type) {
  const handlers = {
    http: HttpHandler,
    https: HttpsHandler,
    ws: WebSocketHandler,
  }
  return new handlers[type]()
}
