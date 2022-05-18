/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

// 该方法为Vue的原型挂载一个_init方法
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid 唯一标识
    vm._uid = uid++

    // 开发环境下的性能检测
    let startTag, endTag
    /* istanbul ignore if */ 
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 不对Vue本身做响应式处理。为此设置标志
    vm._isVue = true
    // merge options 合并用户传入的options和构造函数中的options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 若传入的options是组件
      initInternalComponent(vm, options)
    } else {
      // 若传入的options是对象
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    // 设置渲染时的代理对象
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 开发环境
      initProxy(vm)
    } else {
      // 设置渲染时的代理对象为Vue本身
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    /**
     * 初始化Vue实例
     */ 
    
    // 初始化跟生命周期相关的函数 $parent/$root/$children/$refs
    initLifecycle(vm)
    // 初始化事件相关函数 
    initEvents(vm)
    // $slots/$scopedSlots/$createElement/$attrs/$listeners
    initRender(vm)
    // 触发beforeCreate钩子函数
    callHook(vm, 'beforeCreate')
    // 实现依赖注入
    initInjections(vm) // resolve injections before data/props
    // 初始化用户传入的options里面的所有属性
    // 初始化 vm 的 _props,/methods/_data/computed/watch
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    
    // 触发created钩子函数
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      // 挂载整个页面
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
