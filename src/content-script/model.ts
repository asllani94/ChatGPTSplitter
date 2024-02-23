import { Channel } from '../utils/ext'

export interface ContentChannel extends Channel<'content'> {
  toggle(): Promise<void>
}
