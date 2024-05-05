import { Channel } from '../utils/ext'

export interface ContentChannel extends Channel<'content'> {
  toggle(): Promise<void>
}

export interface IChat {
  name: string
  domain: 'chat.openai.com' | 'poe.com'
  canSend(): boolean
  sendPrompt(text: string): void | Promise<void>
}
