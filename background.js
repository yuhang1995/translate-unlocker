// 安装或更新扩展时初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true }, () => {
    console.log('翻译解禁：初始化状态为启用');
  });
  updateBadge(true);
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['enabled'], (data) => {
    const newState = !data.enabled;
    chrome.storage.local.set({ enabled: newState }, () => {
      console.log(`翻译解禁：状态切换为${newState ? '启用' : '禁用'}`);
      updateBadge(newState);
      
      // 向当前标签页发送消息
      if (tab && tab.url && tab.url.startsWith('http')) {
        try {
          chrome.tabs.sendMessage(tab.id, { action: 'toggleTranslation', enabled: newState })
            .catch(error => console.error('向当前标签发送消息失败:', error));
        } catch (error) {
          console.error('无法发送消息到标签页:', error);
        }
      }
    });
  });
});

// 更新状态指示器
function updateBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: ' ' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    chrome.action.setTitle({ title: "翻译解禁：已启用" });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: "翻译解禁：已禁用" });
  }
}

// 监听来自content脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    chrome.storage.local.get(['enabled'], (data) => {
      sendResponse({ enabled: data.enabled });
    });
    return true; // 保持消息通道开放以进行异步响应
  }
});

// 当标签页更新时，检查扩展状态并更新图标
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    chrome.storage.local.get(['enabled'], (data) => {
      updateBadge(data.enabled);
    });
  }
});

// 当标签页激活时，更新图标状态
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(['enabled'], (data) => {
    updateBadge(data.enabled);
  });
}); 