/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * // getter和setter 用来收集依赖和派发更新
 */
export class Observer {
  // flow 语法，flow是es的超集
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    // 为子对象收集依赖
    // 在defineReactive中定义的dep对象是为当前属性收集依赖
    this.dep = new Dep()
    this.vmCount = 0
    // 设置_ob_属性为不可枚举的
    // 遍历对象的属性设置getter和setter时，该属性不会被遍历
    def(value, '__ob__', this)
    // 数组的响应式处理
    if (Array.isArray(value)) {
      // 处理浏览器兼容问题
      if (hasProto) {
        // 当前浏览器支持对象原型属性_proto_
        // 将value数组的原型属性设置为arrayMethods(数组相关方法，是一个对象)
        // arrayMethods 一个新创建的、原型指向数组构造函数原型的对象
        protoAugment(value, arrayMethods)
      } else {
        // 不支持原型的情况  arrayKeys 是arrayMethods中属性的名字，数组
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 遍历数组元素（调用observe方法，只处理对象），将之转换为响应式对象
      this.observeArray(value)
    } else {
      // 对象的响应式处理
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    // 获取对象中的所有属性
    const keys = Object.keys(obj)
    // 遍历所有属性，为该属性设置响应式的getter和setter
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   * 对数组做响应式处理
   */
  observeArray (items: Array<any>) {
    // 遍历数组成员，若为对象，将之转换为响应式的
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
// 把修补过得数组方法重新设置到目标对象中
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    // 传入的value不是对象或者 是虚拟dom节点，则不需要响应式处理
    return
  }
  // 一般是Observer对象
  let ob: Observer | void
  // 如果value中有_ob_属性（Observer对象）且该属性为Observer对象，则赋值
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    // 这是需要响应式处理的逻辑判断
    shouldObserve &&
    // 不是服务端渲染
    !isServerRendering() &&
    // value是数组或者value是纯粹的js对象
    (Array.isArray(value) || isPlainObject(value)) &&
    // value 可扩展
    Object.isExtensible(value) &&
    // value 不是Vue实例（Vue实例不需要响应式处理）
    !value._isVue
  ) {
    // 创建Observer对象对value进行响应式处理
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    // 如果是根对象，则计数值自增
    ob.vmCount++
  }
  // 返回Observer对象的这个实例
  return ob
}

/**
 * Define a reactive property on an Object.
 * 为一个对象定义一个响应式的属性
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  // 监听对象的第一层属性还是全部，true，则只监听第一层的属性
  shallow?: boolean
) {
  // 创建dep对象，负责为当前属性收集依赖
  const dep = new Dep()
  // 获取当前属性的属性描述符
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    // 如果当前属性不可配置（不可通过delete删除，不可通过defineProperty重新定义
    // 则直接返回
    return
  }

  // cater for pre-defined getter/setters
  // 若用户为属性定义了get和set方法，获取这些方法，并为之添加依赖收集和派发更新的功能
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    // 若用户只设置了set方法且未传入属性对应的值，获取这个值
    val = obj[key]
  }
  // 若需要为子对象定义响应式数据，则递归调用observe函数进行响应式处理
  // 返回子观察对象
  let childOb = !shallow && observe(val)
  // 
  Object.defineProperty(obj, key, {
    // 可枚举
    enumerable: true,
    // 可配置
    configurable: true,
    get: function reactiveGetter () {
      // 若用户设置了get函数，则调用它获取属性的值
      const value = getter ? getter.call(obj) : val
      // 若Watcher存在，收集依赖，建立依赖关系
      if (Dep.target) {
        // 依赖收集
        /**
         * 1. 把当前dep对象添加到watcher对象的newDeps数组中
         * 2. 把当前watcher对象添加到dep对象的subs数组中
         */
        dep.depend()
        // 若果子观察对象存在，建立子对象的依赖关系
        if (childOb) {
          // 让子对象收集依赖
          // 这个dep对象是在Observer中定义的
          // 当子对象中添加或删除成员时也需要发送通知，更新视图
          // 在$set,$delete方法中会用到
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      // 返回属性的值
      return value
    },
    set: function reactiveSetter (newVal) {
      // 获取旧的属性值
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        // NaN 不等于它自身
        // 第二个判断，处理NaN的情况。当新值和旧值都为NaN（not a number）
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 若getter存在但setter不存在，则该属性为只读属性，函数执行结束
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 若新值是对象，将新值转换为响应式对象
      childOb = !shallow && observe(newVal)
      // 派发更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 * Vue的静态方法set()
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    // 未定义或是原始值的对象，不能被设置响应式属性
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // target是数组且传入的index有效
    target.length = Math.max(target.length, key)
    // 用响应式改造过得splice函数对key位置的元素进行替换
    // 删除key位置开始的1个连续元素，并将val插入到这个位置
    target.splice(key, 1, val)
    // 返回新的value
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    // 属性存在于目标对象中且不存在于目标对象的原型上，用方括号语法重新赋值
    target[key] = val
    // 返回新值
    return val
  }
  // 获取target中的observer对象。每个被响应化的数据都对应一个observer对象
  const ob = (target: any).__ob__
  // 不能在Vue实例和其根对象$data上挂载数据
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  
  if (!ob) {
    // 若目标对象没有_ob_属性，即不是响应式对象，用方括号语法赋值并返回新值
    target[key] = val
    return val
  }
  // 将ob.value（target对象）的key属性设置为响应式的(为属性定义getter和setter)
  defineReactive(ob.value, key, val)
  // 派发更新 
  // 由于在收集依赖时为每个子对象都创建了childOb，才能在此处派发更新
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    // 目标对象不能是undefined、null或原始值
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 处理数组
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 删除元素，直接返回
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  // 不能删除Vue实例和$data对象
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果对象中没有要删除的属性，函数直接返回
  if (!hasOwn(target, key)) {
    return
  }
  // 删除属性
  delete target[key]
  // 若target不是响应式的，直接返回
  if (!ob) {
    return
  }
  // 派发变化
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
