import { IChat } from './model'

export function chatgpt(): IChat {
  return {
    name: 'chatgpt',
    domain: 'chat.openai.com',
    canSend() {
      const $sendButton = document.querySelector('[data-testid="send-button"]')
      if (!$sendButton) {
        return false
      }
      return true
    },
    sendPrompt(text: string) {
      if (!this.canSend()) {
        return
      }
      const $sendButton = document.querySelector('[data-testid="send-button"]')
      const $input = document.querySelector(
        '#prompt-textarea',
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
