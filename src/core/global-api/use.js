/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  // 给Vue增加了use方法
  Vue.use = function (plugin: Function | Object) {
    // this是调用方法的对象的this，即Vue的构造函数
    // installedPlugins 记录已经安装的所有插件
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 若作为参数的插件没有在已安装的插件数组中，直接返回this
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 从index为1的位置将函数的形参转换为数组，这里接收的是plugin安装时需要的参数
    const args = toArray(arguments, 1)
    // 把this(Vue)插入args数组，作为第一个元素
    args.unshift(this)
    // 若插件的install方法的类型是function，即plugin参数本身是一个对象且存在install方法
    if (typeof plugin.install === 'function') {
      // 调用plugin的install方法注册插件
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 若plugin本身是一个函数，直接调用这个函数
      plugin.apply(null, args)
    }
    // 将新注册的插件加入已经安装插件数组中
    installedPlugins.push(plugin)
    return this
  }
}
