# 翻译解禁 (TranslateUnlocker)

一个简单的浏览器扩展，用于解除网页上的翻译限制。

## 功能

- 将网页上的 `translate="no"` 属性修改为 `translate="yes"`，让这些元素可以被浏览器的翻译功能翻译
- 点击扩展图标即可快速切换启用/禁用状态
- 默认为启用状态，安装后立即生效
- 实时监测网页变化，处理动态加载的内容

## 安装方法

### Chrome / Edge / 其他基于Chromium的浏览器

1. 下载并解压缩此扩展
2. 打开浏览器，进入扩展管理页面 (Chrome: `chrome://extensions/`, Edge: `edge://extensions/`)
3. 启用"开发者模式"
4. 点击"加载已解压的扩展"按钮
5. 选择此扩展的文件夹

## 使用方法

1. 安装扩展后，扩展默认为启用状态
2. 点击工具栏上的扩展图标可快速切换启用/禁用状态
   - 图标右下角显示绿色小点：翻译解禁功能已启用
   - 图标无绿色小点：翻译解禁功能已禁用
3. 启用状态下，页面上所有带有 `translate="no"` 属性的元素都会被修改为 `translate="yes"`，使其可翻译
4. 禁用状态下，将恢复所有元素的原始属性值

## 注意事项

- 此扩展修改页面元素的 `translate` 属性，不提供翻译功能本身
- 翻译功能需要使用浏览器内置的翻译功能或其他翻译扩展
- 某些网站可能通过其他方式限制翻译，此扩展可能无法解决所有翻译限制问题
