// 定义Vue构造函数，并初始化相关对象和方法

import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// Vue 的构造函数 
// 为什么不使用类的语法？
// 因为给vue的原型上挂在了很多属性和方法，使用class，在语法上不搭
function Vue (options) {
  // 如果工作在开发环境且当前this不是Vue的实例，说明没使用new 方法创建Vue实例
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    // 给出警告
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 调用_init方法，用传入的options初始化一个Vue实例
  this._init(options)
}

/**
 * 给Vue中混入实例成员 
 */


// 给Vue的原型挂载_init对象
initMixin(Vue)
// Vue.$data/$set/$props/$watch/$delete
stateMixin(Vue)
// 初始化事件相关方法， $on/$once/$off/$emit
eventsMixin(Vue)
// 初始化生命周期相关混入方法 _update/$forceUpdate/$destroy
lifecycleMixin(Vue)
// 混入 render
// $nextTick/_render
renderMixin(Vue)

export default Vue
