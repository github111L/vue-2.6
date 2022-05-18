/* @flow */

import { mergeOptions } from '../util/index'

export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    // 把mixin对象中的所有成员拷贝到this.options中
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
