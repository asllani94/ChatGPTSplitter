export interface IChat {
  name: string
  domain: 'chat.openai.com' | 'copilot.cloud.microsoft'
  canSend(): boolean
  sendPrompt(text: string): void | Promise<void>
}
