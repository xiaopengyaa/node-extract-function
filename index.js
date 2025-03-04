const fs = require('fs-extra')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const t = require('@babel/types')
const { globalObjs } = require('./globalObjs')

// 主函数名称
// const MAIN_FUNCTION = 'Episode'
const MAIN_FUNCTION = 'Student'
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
        // 处理函数表达式
        FunctionExpression(path) {
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
              path,
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
        ExpressionStatement(path) {
          const expression = path.node.expression
          const hasExpression =
            t.isMemberExpression(expression.left) &&
            hasExpressionName(expression.left.object, targetName)

          if (hasExpression) {
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
      })
    },
  })

  if (!found) return

  // 从最新添加的代码中提取依赖
  const lastAdded = outputs[outputs.length - 1]
  const dependencies = findExternalDependencies(lastAdded)
  while (dependencies.length) {
    const exDepName = dependencies.shift()
    collectDependencies(ast, exDepName, collected, outputs)
  }
}

function hasExpressionName(object, targetName) {
  if (t.isMemberExpression(object)) {
    return hasExpressionName(object.object, targetName)
  } else if (t.isIdentifier(object)) {
    if (object.name === targetName) {
      return true
    }
  }
  return false
}

// 收集声明节点
function collectDeclaration(path, collected, outputs, type) {
  const node = path.node
  const name = getDeclarationName(node)

  if (!name || collected.has(node.start)) return false

  // 生成原始代码
  let code
  if (t.isVariableDeclarator(node)) {
    // 变量声明只生成当前的那一个
    const cloneParentNode = t.cloneNode(path.parentPath.node)
    cloneParentNode.declarations = cloneParentNode.declarations.filter(
      (d) => d.id.name === name
    )
    code = generator(cloneParentNode).code
  } else {
    code = generator(node).code
  }
  outputs.push({ name, code, type, start: node.start, node })
  collected.add(node.start)
  console.log('收集依赖：', name)

  return true
}

// 获取声明名称
function getDeclarationName(node) {
  if (t.isFunctionDeclaration(node)) return node.id?.name
  if (t.isVariableDeclarator(node)) return node.id?.name
  if (t.isClassDeclaration(node)) return node.id?.name
  if (t.isFunctionExpression(node)) return node.id?.name
  if (t.isExpressionStatement(node)) return node.expression.left.property.name
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
      console.log(`依赖判断${output.name}：`, path.node.name)
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
  if (parentPath.isVariableDeclarator() && !path.isIdentifier()) {
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
  const start = process.hrtime()
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
  const end = process.hrtime(start)
  console.log(`收集总数： ${outputs.length}`)
  console.log(`总共耗时：${end[0]}秒`)
  console.log(`输出已保存至 ${outputFile}`)
}

// 使用示例
extractExport(INPUT_PATH, MAIN_FUNCTION, EXPORT_PATH)
