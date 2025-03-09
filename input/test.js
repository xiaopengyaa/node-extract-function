// ================= 基类与接口模式 =================
var config = { logLevel: 2 } // 全局配置

// 抽象接口模式
class DataInterface {
  validate() {
    throw new Error('必须实现 validate 方法')
  }
}

// 基础处理器（父类）
class BaseProcessor extends DataInterface {
  static DEFAULT_COUNT = 5 // 静态常量
  #internalCount = 0 // 私有字段

  constructor() {
    super()
    this.count = 0 // 实例属性
  }

  // 方法参数重复变量名
  process(data, config = { batchSize: 10 }) {
    let count = 0 // 屏蔽类属性

    const helper = () => {
      const count = data.length // 箭头函数作用域
      this.#internalCount += count
      console.log(`处理了 ${count} 条数据`)
    }

    helper()

    return this.#transform(data, config)
  }

  // 私有方法重复变量名
  #transform(data, config) {
    const result = []
    for (let config of data) {
      // 屏蔽参数 config
      if (this.validate(config)) {
        result.push(config * 2)
      }
    }
    return result
  }

  validate(item) {
    return item > 0
  }
}

// ================= 派生类与工厂模式 =================
var config = { debug: true } // 重复全局变量名

// 高级处理器（子类）
class AdvancedProcessor extends BaseProcessor {
  #cache = new Map() // 私有字段

  constructor() {
    super()
    this.count = 100 // 覆盖父类属性
  }

  // 方法重复变量名
  process(data, config) {
    const count = super.process(data, config).length // 局部变量
    this.#cache.set(Date.now(), count)

    // IIFE 重复变量名
    ;(function analyze() {
      const config = { precision: 2 } // 屏蔽参数
      console.log(`分析精度: ${config.precision}`)
    })()

    return this.#enhance(count)
  }

  // 私有方法
  #enhance(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      value: Math.random(),
    }))
  }
}

// ================= 工具模块 =================
function createFactory(config) {
  let count = 0 // 闭包变量

  return {
    // 生成器方法
    *generate() {
      const count = config.batchSize // 屏蔽闭包变量
      for (let i = 0; i < count; i++) {
        yield { id: i, data: [] }
      }
    },

    // 异步验证器
    async validate(data) {
      const results = []
      let count = 0 // 重复变量名

      await Promise.all(
        data.map(async (item) => {
          const isValid = await check(item)
          if (isValid) {
            count++
            results.push(item)
          }
        })
      )

      return { results, count }
    },
  }

  // 内部函数
  function check(item) {
    const config = { timeout: 1000 } // 屏蔽外部 config
    return new Promise((resolve) => {
      setTimeout(() => resolve(item.value > 0.5), config.timeout)
    })
  }
}

// ================= 复杂实现 =================
class CustomProcessor extends AdvancedProcessor {
  static VERSION = '2.3.1' // 静态属性

  #observer // 私有字段

  constructor(observer) {
    super()
    this.#observer = observer
    this.stats = { count: 0 } // 复杂对象属性
  }

  // 覆盖方法
  process(data) {
    const config = this.#observer.getConfig() // 方法调用
    const result = super.process(data, config)

    // 事件回调
    this.#observer.onProcessed({
      type: 'update',
      data: {
        count: result.length, // 结果数量
        data: result.map((item, count) => ({
          // 参数重复
          ...item,
          index: count++,
        })),
      },
    })

    return this.#filter(result)
  }

  // 私有方法
  #filter(data) {
    return data.filter((item) => {
      const count = this.stats.count // 对象属性
      return item.value > 0.1 * count
    })
  }
}

// ================= 使用示例 =================
;(function main() {
  const config = { batchSize: 7 } // 局部配置
  const factory = createFactory(config)
  const observer = {
    getConfig: () => ({ debug: false }),
    onProcessed: (data) => console.log('处理完成:', data),
  }

  const processor = new CustomProcessor(observer)
  const generator = factory.generate()

  // 多层嵌套作用域
  function run() {
    const data = Array.from(generator)
    let count = 0 // 局部变量

    const processTask = async () => {
      const result = processor.process(data)
      const { results, count: validCount } = await factory.validate(result)

      count += validCount
      console.log(`有效数据: ${count}`)
    }

    processTask().catch(console.error)
  }

  if (config.batchSize > 5) {
    run()
  }
})()
