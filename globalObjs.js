const globalObjs = [
  // 核心 JavaScript 全局对象（含 ES6+）
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Function',
  'Math',
  'JSON',
  'Date',
  'Promise',
  'Error',
  'TypeError',
  'SyntaxError',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'URIError',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet', // ES6 新增数据结构
  'Symbol', // ES6 唯一值
  'Proxy',
  'Reflect', // ES6 元编程
  'BigInt', // ES2020 大整数
  'GeneratorFunction',
  'AsyncFunction', // 生成器和异步函数构造函数

  // 浏览器 BOM
  'window',
  'navigator',
  'location',
  'history',
  'screen',
  'alert',
  'confirm',
  'prompt',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',

  // DOM 相关
  'document',
  'console',

  // Web API 和 ES6+ 扩展
  'fetch',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'WebSocket',
  'IntersectionObserver',
  'MutationObserver',
  'URL',
  'URLSearchParams',
  'Intl', // 国际化 API（如日期、货币格式化）
  'Atomics', // 共享内存原子操作（ES2017）
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView', // 二进制数据
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array', // 类型化数组

  // 事件相关
  'Event',
  'CustomEvent',
  'addEventListener',
  'removeEventListener',

  // 特殊全局值
  'undefined',
  'NaN',
  'Infinity',

  // 其他环境特定
  'FinalizationRegistry', // ES2021 弱引用和终结器
]

module.exports = {
  globalObjs,
}
