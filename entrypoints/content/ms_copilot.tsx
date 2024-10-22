import { IChat } from './model'

export function ms_copilot(): IChat {
  return {
    name: 'ms_copilot',
    domain: 'm365.cloud.microsoft',
    canSend() {
      const $iframeDoc = document.querySelector('[data-tid="app-host-iframe"]');
      const $sendButton = $iframeDoc!!.querySelector('[is="cib-button"]')
      if (!$sendButton) {
        return false
      }
      return true
    },
    sendPrompt(text: string) {
      if (!this.canSend()) {
        return
      }
      const $iframeDoc = document.querySelector('[data-tid="app-host-iframe"]');
      const $sendButton = $iframeDoc!!.querySelector('[is="cib-button"]')
      const $input = $iframeDoc!!.querySelector(
        '#searchbox.text-area',
      ) as HTMLTextAreaElement
      if (!$input || !$sendButton) {
        throw new Error('No input or send button found')
      }
      $input.value = text
      $input.dispatchEvent(new InputEvent('input', { bubbles: true }))
      $sendButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    },
  }
}
