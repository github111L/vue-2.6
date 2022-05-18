/* @flow */
// 使用flow静态语法检查
// vscode报错，泛型的语法只能在ts中使用，设置json文件中js代码检查为false即可
import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config 对象的描述符
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    // 给config对象重新赋值，会触发set方法
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  // 给Vue注册config属性
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // util 方法不是作为公共API来使用的，可能只在Vue 内部使用
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 全局方法set、delete、nextTick  响应式相关
  // 静态方法，直接挂载到Vue的构造函数上
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 用flow中的泛型，后面代码不能高亮显示，解决方法：安装vscode的babel-javascript 插件
  // 但会丢失“跳转到定义部分”的功能

  // observable 让一个对象编程可响应的  响应式相关
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }
  /**
   * Object.create(proto, [propertiesObject])
     proto: 新创建对象的原型对象
     propertiesObject：可选参数。要添加新对象的可枚举属性（新添加的属性是自身的属性，而不是其原型链上的属性）
  */

  // 初始化Vue.options对象，并为其扩展components，directives，filters成员
  // 存储全局的组件、指令和过滤器
  // Object.create(null) 创建新对象，设置对象的原型为null
  Vue.options = Object.create(null)
  // 组件、指令、过滤器
  ASSET_TYPES.forEach(type => {
    //当需要一个非常干净且高度可定制的对象当做数据字典的时候可以使用Object.create(null)来创建空对象
    //新创建的对象除了自身属性外，原型链上没有任何属性
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 记录当前vue的构造函数，留作后用
  Vue.options._base = Vue

  // 设置keep-alive组件
  // extend方法：把内置组件的成员做浅拷贝，到Vue.options.components中
  // builtInComponents就是keep-alive组件，从core/components/index中导出
  extend(Vue.options.components, builtInComponents)
  // 注册Vue。use(),用来注册插件
  initUse(Vue)
  // 注册Vue.mixin()，用来实现混入
  initMixin(Vue)
  // 注册Vue.extend()，基于传入的options返回一个组件的构造函数
  initExtend(Vue)
  // 注册Vue.directive(),Vue.component(),Vue.filter()
  initAssetRegisters(Vue)
}
