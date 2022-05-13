/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */
export function query (el: string | Element): Element {
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    // 若没有找到已经存在的dom元素
    if (!selected) {
      // 如果当前不在生产环境，就在浏览器控制台打印：不能找到以el为选择器的dom元素
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      // 返回以el为选择器的dom元素—— div
      return document.createElement('div')
    }
    return selected
  } else {
    // 若el是dom元素，则直接返回el
    return el
  }
}
