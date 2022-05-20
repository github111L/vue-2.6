/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    // 是否是渲染Watcher
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      // 为_watcher 属性赋值（vm._watcher中存储的是渲染watcher）
      vm._watcher = this
    }
    // 将计算watcher或侦听器watcher存储在_watchers队列中
    vm._watchers.push(this)
    // options
    if (options) {
      // 这些属性默认是false
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      // 传入的函数，会触发beforeUpdate钩子函数
      this.before = options.before
    } else {
      // 若没有options选项，会把上述选项全部置为false
      this.deep = this.user = this.lazy = this.sync = false
    }
    // 构造函数的第三个参数，用户watcher, 传真实的回调函数
    // 渲染watcher，传一个空函数noop
    this.cb = cb
    // 唯一标识watcher
    this.id = ++uid // uid for batching
    // 标识当前watcher是否是活动的（被激活的）
    this.active = true

    this.dirty = this.lazy // for lazy watchers
    // 记录跟watcher相关的dep
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    // 渲染watcher updateComponent 执行完该函数，更新被渲染到页面
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      // 创建侦听器时传字符串 如：watch：{'person.name':function...}
      // parsePath()返回一个函数，获取person.name的值
      // 这里仍旧会触发属性的get方法，收集依赖，做响应式处理
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // 渲染watcher，lazy为false 执行get方法
    // 计算watcher，lazy为true 延迟执行
    //（计算属性对应的方法是在模板中——render过程中调用的）
    this.value = this.lazy
      ? undefined
      // 在get()方法中调佣pushTarget , 为 Dep.target 赋值
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    // 把当前watcher对象赋值给Dep.target
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // this.getter 就是创建Watcher对象时传入的updateComponent方法
      // 用户watcher，this.getter 是获取属性的方法
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // 深度监听 监听对象下的所有子属性
      if (this.deep) {
        traverse(value)
      }
      // 将当前target出栈
      popTarget()
      // 把当前watcher从dep的subs数组中移除
      // 且移除watcher中记录的dep
      // watcher执行完，渲染结束，所以需要清理各种依赖
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   * 收集依赖的核心代码
   */
  addDep (dep: Dep) {
    // id，唯一表示当前dep对象
    const id = dep.id
    // 为什么要在watcher中添加dep？？？
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        // 把当前watcher对象添加到dep对象的subs数组中
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    // 渲染watchr， lazy为false 立即执行
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      // 渲染watcher对应的函数
      // 把当前watcher入队
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    // 当前watcher是否是存活状态，默认是true
    if (this.active) {
      // 若当前watcher存活，调用watcher的get方法
      // 若是渲染watcher，调用updateComponent渲染页面，返回值为undefined
      // 若为计算watcher或侦听器watcher，则延迟执行
      // 用户watcher，调用this.get()获取当前属性的值
      const value = this.get()
      // 用户watcher才会往下执行，渲染watcher，其value为undefined，不满足if的条件
      // undefined == true 结果为false
      // undefined == false 结果为false
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value 获取旧值，记录新值
        const oldValue = this.value
        this.value = value
        if (this.user) {
          // 用户watcher
          const info = `callback for watcher "${this.expression}"`
          // 调用用户传入的回调函数，并加上异常处理相关代码
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          // 侦听器对应的function就是cb，是用户定义的回调函数
          // 这个cb和render watcher无关，render watcher传入的是空函数noop
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
