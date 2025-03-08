const fs = require('fs-extra')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const t = require('@babel/types')
const {
  findPath,
  getDeclarationName,
  isExternalDependency,
} = require('./utils/common')

// 主函数名称
// const MAIN_FUNCTION = 'Episode'
// const INPUT_PATH = './input/search.js'
const MAIN_FUNCTION = 'Student'
const INPUT_PATH = './input/test.js'
const EXPORT_PATH = `./output/${MAIN_FUNCTION}.js`
const PARSE_OPTIONS = {
  sourceType: 'module',
  attachComment: false,
  plugins: ['jsx', 'typescript', 'classProperties'],
}

// 初始化
extractExport(INPUT_PATH, MAIN_FUNCTION, EXPORT_PATH)

// 主函数
function extractExport(inputFile, exportName, outputFile) {
  const start = process.hrtime()
  const code = fs.readFileSync(inputFile, 'utf-8')
  const ast = parser.parse(code, PARSE_OPTIONS)
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
  console.log(`收集总数: ${outputs.length}`)
  console.log(`总共耗时: ${end[0]}秒`)
  console.log(`输出已保存至 ${outputFile}`)
}

// 递归收集依赖
function collectDependencies(
  ast,
  targetName,
  collected = new Set(),
  outputs = []
) {
  const foundOutputs = []
  traverse(ast, {
    Program(path) {
      // 处理函数声明、函数表达式、类声明
      const listenNames =
        'FunctionDeclaration|FunctionExpression|ClassDeclaration'
      path.traverse({
        [listenNames](path) {
          const output = handleCollectDeclaration(
            path,
            targetName,
            collected,
            outputs
          )
          if (output) {
            foundOutputs.push(output)
          }
        },
      })
    },
  })

  if (!foundOutputs.length) return

  // 提取targetName所对应的依赖
  const filterOutputs = foundOutputs.filter((item) => item.name === targetName)
  while (filterOutputs.length) {
    const output = filterOutputs.shift()
    findExternalDependencies(output, collected, outputs)
  }
}

function handleCollectDeclaration(path, targetName, collected, outputs) {
  // 收集依赖
  if (path.node.id?.name === targetName) {
    const output = collectDeclaration(path, collected, outputs)
    return output
  }
}

// 查找代码中的外部依赖
function findExternalDependencies(output, collected, outputs) {
  output.path.traverse({
    Identifier(path) {
      console.log(`依赖判断${output.name}:`, path.node.name)
      // 收集主函数的依赖和其他外部依赖
      const main = outputs[0]
      if (
        (main &&
          path.parentPath.node.start === main.node.start &&
          path.node.name === main.name) ||
        isExternalDependency(path)
      ) {
        const binding = path.scope.getBinding(path.node.name)
        if (binding) {
          if (binding.scope.uid !== 0) {
            const output = collectDeclaration(
              binding.scope.path,
              collected,
              outputs
            )
            if (output) {
              findExternalDependencies(output, collected, outputs)
            }
            return
          }
          const paths = [binding.path]
          const startSet = new Set([binding.path.node.start])
          const otherPaths = [
            ...binding.constantViolations,
            ...binding.referencePaths,
          ]
          // 去重
          otherPaths.forEach((p) => {
            if (!startSet.has(p.node.start)) {
              startSet.add(p.node.start)
              paths.push(p)
            }
          })
          paths.forEach((p) => {
            // 两个语句需要在同一个作用域下
            if (
              p?.parentPath.scope.uid === binding.path?.parentPath.scope.uid
            ) {
              const path = findPath(p) || p
              const output = collectDeclaration(path, collected, outputs)
              if (output) {
                findExternalDependencies(output, collected, outputs)
              }
            }
          })
        }
      }
    },
  })
}

// 收集声明节点
function collectDeclaration(path, collected, outputs) {
  const node = path.node
  const name = getDeclarationName(node)

  if (collected.has(node.start)) return ''

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
  const output = { name, code, start: node.start, node, path }
  outputs.push(output)
  collected.add(node.start)
  console.log('收集依赖:', name)

  return output
}
