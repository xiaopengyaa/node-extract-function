const { globalObjs } = require('./globalObjs')
const t = require('@babel/types')

function findPath(path) {
  return findAssignmentPath(path) || findDefinePropertyPath(path)
}

// 如果是对象属性，需要找到最近的赋值语句
function findAssignmentPath(path) {
  let p = null
  if (t.isIdentifier(path.node) && path.key === 'object') {
    let checkPath = path.parentPath
    while (checkPath) {
      if (t.isAssignmentExpression(checkPath.node)) {
        p = checkPath
        break
      }
      checkPath = checkPath.parentPath
    }
  }
  return p
}

// 如果是函数调用，需要找到最近的Object.defineProperty调用语句
function findDefinePropertyPath(path) {
  let p = null
  if (t.isIdentifier(path.node) && path.key === 'object') {
    let checkPath = path.parentPath
    while (checkPath) {
      if (
        t.isCallExpression(checkPath.node) &&
        checkPath.node.callee.object.name === 'Object' &&
        checkPath.node.callee.property.name === 'defineProperty'
      ) {
        p = checkPath
        break
      }
      checkPath = checkPath.parentPath
    }
  }
  return p
}

// 判断是否为目标表达式
function hasExpressionName(node, targetName) {
  let n = node
  while (n) {
    if (n.name === targetName) {
      return true
    }
    n = n.object
  }
  return false
}

// 获取声明名称
function getDeclarationName(node) {
  if (t.isFunctionDeclaration(node)) return node.id?.name
  if (t.isVariableDeclarator(node)) return node.id?.name
  if (t.isClassDeclaration(node)) return node.id?.name
  if (t.isFunctionExpression(node)) return node.id?.name
  if (t.isExpressionStatement(node)) return node.expression.left.property.name
  if (t.isAssignmentExpression(node)) {
    return node.left.property ? node.left.property.name : node.left.name
  }
  return ''
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
    if (parentObject.type === 'ThisExpression') {
      return false
    }
    if (globalObjs.includes(parentObjectName)) {
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
  return !binding || binding.scope.uid !== path.scope.uid
}

module.exports = {
  findPath,
  findAssignmentPath,
  findDefinePropertyPath,
  hasExpressionName,
  getDeclarationName,
  isExternalDependency,
}
