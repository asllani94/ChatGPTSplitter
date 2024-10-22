import { onMessage, sendMessage } from './model/messaging'

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (
      !tab.url ||
      !(
        tab.url.startsWith('https://chat.openai.com/') ||
        tab.url.startsWith('https://m365.cloud.microsoft/')
      )
    ) {
      return
    }
    await sendMessage('toggle', undefined, tab.id)
  })
})
