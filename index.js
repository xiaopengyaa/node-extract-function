const fs = require('fs-extra')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const t = require('@babel/types')
const { globalObjs } = require('./globalObjs')

// 主函数名称
// const MAIN_FUNCTION = 'setupSearchReporter'
const MAIN_FUNCTION = 'createHandler'
// const INPUT_PATH = './input/search.js'
const INPUT_PATH = './input/test.js'
const EXPORT_PATH = `./output/${MAIN_FUNCTION}.js`
const TYPE = {
  FUNCTION: 'FUNCTION',
  VARIABLE: 'VARIABLE',
  CLASS: 'CLASS',
}

// 递归收集依赖的声明
function collectDependencies(
  ast,
  targetName,
  collected = new Set(),
  outputs = []
) {
  if (collected.has(targetName)) return

  let found = false

  traverse(ast, {
    Program(path) {
      path.traverse({
        // 处理函数声明
        FunctionDeclaration(path) {
          if (path.node.id?.name === targetName) {
            const flag = collectDeclaration(
              path,
              collected,
              outputs,
              TYPE.FUNCTION
            )
            if (flag) {
              found = true
            }
          }
        },
        // 处理变量声明（包含所有类型）
        VariableDeclarator(path) {
          if (path.node.id.name === targetName) {
            const flag = collectDeclaration(
              path.parentPath,
              collected,
              outputs,
              TYPE.VARIABLE
            )
            if (flag) {
              found = true
            }
          }
        },
        // 处理类声明
        ClassDeclaration(path) {
          if (path.node.id.name === targetName) {
            const flag = collectDeclaration(
              path,
              collected,
              outputs,
              TYPE.CLASS
            )
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
  const lastAdded = outputs[outputs.length - 1]
  const dependencies = findExternalDependencies(lastAdded)
  while (dependencies.length) {
    const ident = dependencies.shift()
    if (!collected.has(ident)) {
      collectDependencies(ast, ident, collected, outputs)
    }
  }
}

// 收集声明节点
function collectDeclaration(path, collected, outputs, type) {
  const node = path.node
  const name = getDeclarationName(node)

  if (!name || collected.has(name)) return false

  // 生成原始代码
  const code = generator(node).code
  outputs.push({ name, code, type, start: node.start, node })
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
function findExternalDependencies(output) {
  const code = output.code
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx'],
  })

  const dependencies = new Set()

  traverse(ast, {
    Identifier(path) {
      console.log('output', output.name)
      if (isExternalDependency(path)) {
        if (path.node.name) {
          dependencies.add(path.node.name)
        }
      }
    },
  })

  return Array.from(dependencies)
}

// 判断是否为需要收集的外部依赖
function isExternalDependency(path) {
  const parentPath = path.parentPath
  if (parentPath.isObjectProperty() && !path.isIdentifier()) {
    return false
  }
  if (parentPath.isMemberExpression()) {
    const parentObject = parentPath.node.object
    const parentObjectName = parentObject.name
    const parentBinding = path.scope.getBinding(parentObjectName)
    if (parentObject.type === 'ThisExpression') {
      return false
    }
    if (globalObjs.includes(parentObjectName) || parentBinding) {
      return false
    }
  }
  if (parentPath.isVariableDeclarator()) {
    return false
  }
  if (parentPath.isFunctionDeclaration()) {
    return false
  }
  if (parentPath.isPrivateName()) {
    return false
  }
  if (parentPath.isClassDeclaration() && path.key !== 'superClass') {
    return false
  }
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
    attachComment: false,
    plugins: ['jsx', 'typescript', 'classProperties'],
  })

  const collected = new Set()
  const outputs = []

  // 递归收集依赖
  collectDependencies(ast, exportName, collected, outputs)

  // 生成最终代码
  const allCode = outputs
    .sort((a, b) => a.start - b.start)
    .map((item) => item.code)
    .join('\n')

  fs.outputFileSync(outputFile, allCode, {})
  console.log(`输出已保存至 ${outputFile}`)
}

// 使用示例
extractExport(INPUT_PATH, MAIN_FUNCTION, EXPORT_PATH)
