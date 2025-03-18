// 不再需要存储原始元素数组
let isEnabled = true; // 默认为启用状态
let observer = null; // 存储 MutationObserver 实例
let isInitialized = false; // 标记是否已初始化

// 初始化
function initialize() {
  if (isInitialized) return; // 防止重复初始化
  
  isInitialized = true;
  
  // 确保body已存在
  if (!document.body) {
    setTimeout(initialize, 100);
    return;
  }
  
  chrome.storage.local.get('enabled', function(data) {
    // 如果存储中有值，则使用存储的值，否则默认为true
    isEnabled = data.enabled !== undefined ? data.enabled : true;
    
    if (isEnabled) {
      modifyTranslateAttribute();
      startObserver();
    }
  });
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initialize();
  });
} else {
  initialize();
}

// 确保在页面完全加载后也执行一次
window.addEventListener('load', function() {
  // 延迟执行以确保动态内容加载完成
  setTimeout(function() {
    if (isEnabled) {
      modifyTranslateAttribute();
    }
  }, 1000);
});

// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // 兼容两种消息类型 - "toggleTranslation"(旧) 和 "toggleState"(新)
  if (message.action === 'toggleTranslation' || message.action === 'toggleState') {
    isEnabled = message.enabled;
    
    try {
      if (isEnabled) {
        modifyTranslateAttribute();
        startObserver();
      } else {
        restoreTranslateAttribute();
        stopObserver();
      }
      
      // 发送响应，确认消息已处理
      sendResponse({
        success: true, 
        status: isEnabled ? 'enabled' : 'disabled',
        modifiedCount: countModifiedElements()
      });
    } catch (error) {
      console.error('处理消息时出错', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
    
    return true; // 表示将异步发送响应
  }
  
  // 处理获取状态的请求
  if (message.action === 'getState') {
    sendResponse({
      enabled: isEnabled,
      modifiedCount: countModifiedElements()
    });
    return true;
  }
});

// 修改translate="no"属性为translate="yes"
function modifyTranslateAttribute() {
  try {
    // 查找所有带有translate="no"属性的元素
    const elements = document.querySelectorAll('[translate="no"]');
    
    let modifiedCount = 0;
    
    elements.forEach((element, index) => {
      try {
        // 保存原始值到数据属性
        if (!element.hasAttribute('data-translate-original')) {
          element.setAttribute('data-translate-original', element.getAttribute('translate'));
        }
        
        // 标记这个元素是由我们扩展修改的
        element.setAttribute('data-translate-modified', 'true');
        
        // 修改translate属性值为"yes"
        element.setAttribute('translate', 'yes');
        
        // 验证是否成功设置
        const newValue = element.getAttribute('translate');
        
        if (newValue === 'yes') {
          modifiedCount++;
        }
      } catch (elementError) {
        console.error('处理元素时出错', elementError);
      }
    });
  } catch (error) {
    console.error('修改translate属性时出错', error);
  }
}

// 恢复translate属性原始值
function restoreTranslateAttribute() {
  try {
    // 查找所有被我们修改过的元素
    const modifiedElements = document.querySelectorAll('[data-translate-modified="true"]');
    
    modifiedElements.forEach((element) => {
      try {
        const originalValue = element.getAttribute('data-translate-original');
        
        // 恢复原始值
        element.setAttribute('translate', originalValue);
        
        // 移除我们的标记
        element.removeAttribute('data-translate-modified');
        element.removeAttribute('data-translate-original');
      } catch (elementError) {
        console.error('恢复元素时出错', elementError);
      }
    });
  } catch (error) {
    console.error('恢复translate属性时出错', error);
  }
}

// 计算已修改元素数量
function countModifiedElements() {
  return document.querySelectorAll('[data-translate-modified="true"]').length;
}

// 启动观察器
function startObserver() {
  try {
    // 如果观察器已存在，先停止它
    if (observer) {
      stopObserver();
    }
    
    // 创建新的观察器
    observer = new MutationObserver(function(mutations) {
      let hasNewTranslateNoElements = false;
      
      mutations.forEach(mutation => {
        // 如果是属性变化
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'translate' && 
            mutation.target.getAttribute('translate') === 'no' &&
            !mutation.target.hasAttribute('data-translate-modified')) {
          hasNewTranslateNoElements = true;
        } 
        // 如果是新增节点
        else if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // 元素节点
              if (node.getAttribute('translate') === 'no' && 
                  !node.hasAttribute('data-translate-modified')) {
                hasNewTranslateNoElements = true;
              }
              
              // 检查子元素
              const childElements = node.querySelectorAll('[translate="no"]:not([data-translate-modified])');
              if (childElements.length > 0) {
                hasNewTranslateNoElements = true;
              }
            }
          });
        }
      });
      
      if (hasNewTranslateNoElements) {
        modifyTranslateAttribute();
      }
    });
    
    // 配置并启动观察器
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['translate'],
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.error('启动页面观察器时出错', error);
  }
}

// 停止观察器
function stopObserver() {
  try {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  } catch (error) {
    console.error('停止页面观察器时出错', error);
  }
}

// 导出函数到全局作用域，方便在控制台调试
window.__translateUnlocker = {
  getStatus: function() {
    return {
      isEnabled: isEnabled,
      modifiedCount: countModifiedElements(),
      hasObserver: !!observer,
      isInitialized: isInitialized
    };
  },
  forceEnable: function() {
    isEnabled = true;
    modifyTranslateAttribute();
    startObserver();
    return `翻译解禁已强制启用，处理了 ${countModifiedElements()} 个元素`;
  },
  forceDisable: function() {
    isEnabled = false;
    restoreTranslateAttribute();
    stopObserver();
    return "翻译解禁已强制禁用";
  },
  debug: function() {
    const noElements = document.querySelectorAll('[translate="no"]');
    const yesElements = document.querySelectorAll('[translate="yes"]');
    const modifiedElements = document.querySelectorAll('[data-translate-modified="true"]');
    return {
      elementsWithTranslateNo: noElements.length,
      elementsWithTranslateYes: yesElements.length,
      modifiedElements: modifiedElements.length,
      details: Array.from(modifiedElements).map(el => ({
        tagName: el.tagName,
        originalValue: el.getAttribute('data-translate-original'),
        currentValue: el.getAttribute('translate'),
        textContent: el.textContent.slice(0, 50) + (el.textContent.length > 50 ? '...' : '')
      }))
    };
  }
}; 