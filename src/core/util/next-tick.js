/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

const callbacks = []
let pending = false

function flushCallbacks () {
  // 表示处理结束
  pending = false
  // 将callbacks备份
  const copies = callbacks.slice(0)
  // 清空callbacks
  callbacks.length = 0
  // 遍历复制的callbacks数组，依次执行回调函数
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  // 优先使用Promise处理回调函数，微任务方式
  // 微任务执行时，dom还没渲染到页面上，直接从dom树上获取数据
  // 微任务是在本次同步任务执行完之后，才开始执行
  /**
   * 1. 数据改变之后会立即通知watcher执行更新，改变视图
   * 2. watcher执行时会先更改dom树中的数据。在当前事件循环结束之后，才会将dom更新到页面上
   * 3. nextTick回调函数(微任务)执行之前，dom树中的数据已经被改变，直接从dom树上获取数据
   */
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
  // 兼容IE 
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  // mutationObserver 监听dom对象的改变，一旦有变，执行回调函数（以微任务形式执行）
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
  // 浏览器不支持Promise，mutationObsever，则降级为setImmediate
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    // setImmediate 总是比 setTimeout 先执行
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
// ctx 执行上下文，一般是Vue实例
export function nextTick (cb?: Function, ctx?: Object) {
  // 接收Promise传过来的resolve
  let _resolve
  // 把cb加上异常处理，存入callbacks数组中
  // 存储所有回调函数
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    // 若队列未被处理，标记队列未处理状态，调用timerFuc函数
    pending = true
    // 遍历callbacks数组，一次调用每一个回调函数
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    // 若cb不存在且有Promise实例，将该实例的resolve方法赋值给_resolve
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
