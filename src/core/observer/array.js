/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// 创建一个对象，让对象的原型指向传入的参数 Array.prototype(数组构造函数的原型)
export const arrayMethods = Object.create(arrayProto)
// 会修改原数组的方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 * 当数组发生变化时，调用notify方法通知改变
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  // 重写arrayMethods对应的原生数组方法，作为它的属性
  // args 是调用数组方法时传入的参数
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    // 获取数组对象关联的observer对象
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
