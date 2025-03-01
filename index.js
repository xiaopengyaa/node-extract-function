const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const t = require('@babel/types')
const static = new Set()
const globalObjs = [
  'console',
  'document',
  'window',
  'history',
  'Array',
  'Object',
  'Math',
  'Date',
  'Number',
  'String',
]

// 主函数名称
const MAIN_FUNCTION = 'setupSearchReporter'
// const MAIN_FUNCTION = 'mainFunction'
const inputFilePath = './input/search.js'
// const inputFilePath = './input/test.js'
const exportFilePath = `./output/${MAIN_FUNCTION}.js`

// 收集类的静态属性和方法
function collectStaticMember(ast) {
  // 遍历 AST 查找目标类
  traverse(ast, {
    ClassDeclaration(path) {
      const node = path.node
      path.get('body.body').forEach((memberPath) => {
        const member = memberPath.node
        if (member.static) {
          const className = node.id.name
          if (t.isClassProperty(member) || t.isClassMethod(member)) {
            static.add(`${className}_${member.key.name}`)
          }
        }
      })
    },
  })
}

// 递归收集依赖的声明
function collectDependencies(
  ast,
  targetName,
  collected = new Set(),
  output = []
) {
  if (collected.has(targetName)) return

  let found = false

  traverse(ast, {
    Program(path) {
      path.traverse({
        // 处理函数声明
        FunctionDeclaration(path) {
          if (path.node.id?.name === targetName) {
            const flag = collectDeclaration(path, collected, output)
            if (flag) {
              found = true
            }
          }
        },
        // 处理变量声明（包含所有类型）
        VariableDeclarator(path) {
          if (path.node.id.name === targetName) {
            const flag = collectDeclaration(path.parentPath, collected, output)
            if (flag) {
              found = true
            }
          }
        },
        // 处理类声明
        ClassDeclaration(path) {
          if (path.node.id.name === targetName) {
            const flag = collectDeclaration(path, collected, output)
            if (flag) {
              found = true
            }
          }
        },
      })
    },
  })

  if (!found) return

  // 从最新添加的代码中提取依赖
  const lastAdded = output[output.length - 1]
  const dependencies = findExternalDependencies(lastAdded.code)
  while (dependencies.length) {
    const ident = dependencies.shift()
    if (!collected.has(ident)) {
      collectDependencies(ast, ident, collected, output)
    }
  }
}

// 收集声明节点
function collectDeclaration(path, collected, output) {
  const node = path.node
  const name = getDeclarationName(node)

  if (!name || collected.has(name)) return false

  // 生成原始代码
  const code = generator(node).code
  output.push({ name, code })
  collected.add(name)
  console.log('收集依赖：', name)

  return true
}

// 获取声明名称
function getDeclarationName(node) {
  if (t.isFunctionDeclaration(node)) return node.id?.name
  if (t.isVariableDeclaration(node)) return node.declarations[0]?.id?.name
  if (t.isClassDeclaration(node)) return node.id?.name
  return null
}

// 查找代码中的外部依赖
function findExternalDependencies(code) {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx'],
  })

  const dependencies = new Set()

  traverse(ast, {
    Identifier(path) {
      if (isExternalDependency(path)) {
        dependencies.add(path.node.name)
      }
    },
  })

  return Array.from(dependencies)
}

// 判断是否为需要收集的外部依赖
function isExternalDependency(path) {
  const pPath = path.parentPath
  if (pPath.isObjectProperty()) return false
  if (pPath.isMemberExpression()) {
    const pObjectName = pPath.node.object.name
    const pBinding = path.scope.getBinding(pObjectName)
    if (globalObjs.includes(pObjectName) || pBinding) {
      return false
    }
  }
  // 排除声明语句本身
  if (pPath.isVariableDeclarator()) return false
  if (pPath.isFunctionDeclaration()) return false
  if (pPath.isClassDeclaration()) return false
  // 排除当前作用域内的定义
  const objectName = path.node.name
  const binding = path.scope.getBinding(objectName)
  return !binding
}

// 主函数
function extractExport(inputFile, exportName, outputFile) {
  const code = fs.readFileSync(inputFile, 'utf-8')
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties'],
  })

  const collected = new Set()
  const output = []

  // collectStaticMember(ast)
  // 递归收集依赖
  collectDependencies(ast, exportName, collected, output)

  // 生成最终代码
  const exportStatement = `export default ${exportName};`
  const allCode = [...output.map((item) => item.code), exportStatement].join(
    '\n\n'
  )

  fs.writeFileSync(outputFile, allCode)
  console.log(`输出已保存至 ${outputFile}`)
}

// 使用示例
extractExport(inputFilePath, MAIN_FUNCTION, exportFilePath)
