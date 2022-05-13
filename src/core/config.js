/* @flow */

import {
  no,
  noop,
  identity
} from 'shared/util'

import { LIFECYCLE_HOOKS } from 'shared/constants'

export type Config = {
  // user
  optionMergeStrategies: { [key: string]: Function };
  silent: boolean;
  productionTip: boolean;
  performance: boolean;
  devtools: boolean;
  errorHandler: ?(err: Error, vm: Component, info: string) => void;
  warnHandler: ?(msg: string, vm: Component, trace: string) => void;
  ignoredElements: Array<string | RegExp>;
  keyCodes: { [key: string]: number | Array<number> };

  // platform
  isReservedTag: (x?: string) => boolean;
  isReservedAttr: (x?: string) => boolean;
  parsePlatformTagName: (x: string) => string;
  isUnknownElement: (x?: string) => boolean;
  getTagNamespace: (x?: string) => string | void;
  mustUseProp: (tag: string, type: ?string, name: string) => boolean;

  // private
  async: boolean;

  // legacy
  _lifecycleHooks: Array<string>;
};

// Vue.config 是一个对象，包含Vue的全局配置。可以在启动应用之前修改下列属性
export default ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line 自定义合并策略的选项
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings. 是否关闭警告，默认不关闭
   */
  silent: false,

  /**
   * Show production mode tip message on boot? 
   * 开发模式下是否在控制台显示生产提示：You are running Vue in development modes 提示
   * 设置为false可关闭该提示
   */
  productionTip: process.env.NODE_ENV !== 'production',

  /**
   * Whether to enable devtools 是否允许vue-devtools检查代码
   * 浏览器环境下为true
   */
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * Whether to record perf 是否开启性能追踪。
   * 只有在开发模式和支持performance.mark api 的浏览器上才有效
   */
  performance: false,

  /**
   * Error handler for watcher errors
   * 指定组件的渲染和观察期间未捕获错误的处理函数。
   * 这个处理函数被调用时，可获取错误信息和 Vue 实例
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   * VUe的运行时警告赋予一个自定义处理函数
   * 只在开发环境下生效，在生产环境下被忽略
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   * 忽略某些自定义元素
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   * 给v-on自定义键位别名
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   * 保留标签，如有，则这些标签不能被注册为组件
   * 依赖平台且可能被改写
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   * 保留属性，如有，不能被注册为一个组件的prop。
   * 平台相关，且可能被改写
   * 
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   * 检查给定标签是否是一个未知元素
   * 平台相关
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   * 获取一个元素的明明空间，初值为一个空函数
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   * 为特定平台解析真正的标签名
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   * 一个标签的attrs是否要与prop属性绑定使用
   * 平台相关
   */
  mustUseProp: no,

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   * 测试和性能相关的配置，设置为false会降低性能
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
}: Config)
