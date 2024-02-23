import Browser from 'webextension-polyfill'
import { warp } from './utils/ext'
import { ContentChannel } from './content-script/model'



// 监听浏览器扩展工具栏图标点击事件
Browser.action.onClicked.addListener((tab) => {
  if (!tab.url || !tab.url.startsWith('https://chat.openai.com/')) {
    return
  }
  warp<ContentChannel>({ name: 'content', tabId: tab.id }).toggle()
})

// 监听当前标签页，如果是 openai 的就 action.enable()
// Browser.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
//   if (tab.url && tab.url.startsWith('https://chat.openai.com/c/')) {
//     Browser.action.enable()
//   } else {
//     Browser.action.disable()
//   }
// })