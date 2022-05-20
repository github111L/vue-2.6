/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  // 在Watcher中给target赋值
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    // 在mountComponent（instance/lifecycle.js）中创建Watcher对象
    // 用来存储当前正在使用的watcher
    // 全局唯一，一次只能有一个watcher被使用
    if (Dep.target) {
      // 调用Watcher中的addDep方法
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    // 克隆subs数组
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      // 按照watcher的创建顺序对数组排序
      subs.sort((a, b) => a.id - b.id)
    }
    // 遍历subs数组，从前到后（先创建的watcher先被调用）调用watcher
    for (let i = 0, l = subs.length; i < l; i++) {
      // 更新
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []
// 入栈，并将当前watcher赋值给Dep.target
export function pushTarget (target: ?Watcher) {
  // 每个组件都有mountComponent方法，在其中创建了watcher对象
  // 故每个组件都有自己的watcher对象
  // 若组件有嵌套，要先渲染子组件，
  // 此时父组件的渲染过程被挂载，则父组件的watcher对象要被存储，以待后用
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
