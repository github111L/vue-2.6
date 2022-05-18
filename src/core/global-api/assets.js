/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string, // 名字
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        // 没传定义，只传了id，目的是获取组件
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          // 在生产环境下，验证组件的名字
          validateComponentName(id)
        }
        // 组件的definition是否是原始对象
        if (type === 'component' && isPlainObject(definition)) {
          // 设置组件名称
          definition.name = definition.name || id
          // this.options._base 就是Vue的构造函数
          // extend，把普通对象转换为Vue 构造函数
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          // 处理指令
          // definition的类型是函数,将之赋值给bind和update方法
          definition = { bind: definition, update: definition }
        }
        // 更新Vue.$options对象中的components,derectives,filters 等函数
        // 若果definition是一个构造函数，直接存储
        this.options[type + 's'][id] = definition
        // 返回构造函数
        return definition
      }
    }
  })
}
