import { defineExtensionMessaging } from '@webext-core/messaging'

interface ProtocolMap {
  getStringLength(data: string): number
  toggle(): void
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>()
