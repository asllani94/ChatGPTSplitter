import { onMessage, sendMessage } from './model/messaging'

export default defineBackground(() => {
  // Listen for clicks on the extension icon in browser toolbar
  browser.action.onClicked.addListener(async (tab) => {
    // Check if we have a valid tab with a URL
    if (!tab.url || !tab.id) {
      return
    }

    // Exclude browser internal pages and extension pages
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('moz-extension://')) {
      return
    }

    // Send toggle message to content script
    await sendMessage('toggle', undefined, tab.id)
  })
})