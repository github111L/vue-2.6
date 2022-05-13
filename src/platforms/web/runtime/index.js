/* @flow */


/**
 * 与平台相关的代码
 * 1. 注册平台相关的组件和指令
 * 2. 注册了$mount和patch这两个方法
 */


import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

// install platform specific utils
// 给Vue.config 中注册方法，在vue内部使用

// 判断是否是关键属性（表单元素的input/checked/selected/muted
// 如果是，设置el.props 属性（属性不设置到标签上）
Vue.config.mustUseProp = mustUseProp
// 是否是保留的标签
Vue.config.isReservedTag = isReservedTag
// 是否是保留的属性
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// 注册平台相关的指令和组件
// install platform runtime directives & components
// extend 把第二个参数（对象）的所有成员复制到第一个参数（对象）中

// 这里的组件是web平台特有的全局指令和组件
// 注册指令 v-model v-show
// 存储在Vue.options.directive 中的指令都是全局的
extend(Vue.options.directives, platformDirectives)
// 注册组件 v-transition v-transitonGroup
// 存储在Vue.options.components 中的组件都是全局的
extend(Vue.options.components, platformComponents)

// install platform patch function
// 判断是否是浏览器环境，是则返回patch，否则返回空函数noop
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
// 给Vue的实例增加了一个$mount 方法
// 内部调用了mountComponent方法，渲染dom
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

// devtools global hook  调试相关代码
/* istanbul ignore next */
if (inBrowser) {
  setTimeout(() => {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue)
      } else if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        )
      }
    }
    if (process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        `You are running Vue in development mode.\n` +
        `Make sure to turn on production mode when deploying for production.\n` +
        `See more tips at https://vuejs.org/guide/deployment.html`
      )
    }
  }, 0)
}

export default Vue
