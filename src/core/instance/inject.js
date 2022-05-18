/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'
// 实现依赖注入
export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
   // 把$options.provide对象中所有成员存储到provided
    vm._provided = typeof provide === 'function'
      ? provide.call(vm) // 函数
      : provide // 对象
  }
}
// 实现依赖注入
export function initInjections (vm: Component) {
  // 把inject对象和vm._provided中共同存在的属性存储大result中
  // 即在父组件的._provided中提供了这些属性
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    // 把这些属性注入到vue实例并设置为响应式数据
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        // 开发环境下不允许给inject中的属性赋值
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}

export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null)
    // 获取inject对象中的所有属性
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 in case the inject object is observed...
      if (key === '__ob__') continue
      const provideKey = inject[key].from
      let source = vm
      while (source) {
        // 将_provided中存在的属性复制到result中
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      if (!source) {
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    return result
  }
}
