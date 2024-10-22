export interface IChat {
  name: string
  domain: 'chat.openai.com' | 'm365.cloud.microsoft'
  canSend(): boolean
  sendPrompt(text: string): void | Promise<void>
}
