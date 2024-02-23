import Browser from 'webextension-polyfill'

export interface Channel<T extends string> {
  name: T
}

export function register<T extends Channel<string>>(api: T) {
  const onMessage: Parameters<
    typeof Browser.runtime.onMessage.addListener
  >[0] = (message, _sender, sendMessage) => {
    if (
      typeof message.method !== 'string' ||
      !message.method.startsWith(api.name + '.')
    ) {
      return
    }
    const p = (message.method as string).slice((api.name + '.').length)
    if (typeof (api as any)[p] !== 'function') {
      throw new Error('method not found')
    }
    ;(async () => {
      console.debug('background receive message', message)
      try {
        const r = await (api as any)[p](...message.params)
        // @ts-expect-error
        sendMessage({ result: r })
      } catch (err: any) {
        // @ts-expect-error
        sendMessage({
          error: {
            code: err.code,
            message: err.message,
            data: err.stack,
          },
        })
      }
    })()
    return true
  }
  Browser.runtime.onMessage.addListener(onMessage)
  return () => Browser.runtime.onMessage.removeListener(onMessage)
}

export function warp<T extends Channel<string>>(options: {
  name: T['name']
  tabId?: number
}): T {
  return new Proxy({} as any, {
    get(_, p) {
      return async (...args: any[]) => {
        const r = await (options.tabId
          ? Browser.tabs.sendMessage(options.tabId, {
              method: options.name + '.' + (p as string),
              params: args,
            })
          : Browser.runtime.sendMessage({
              method: options.name + '.' + (p as string),
              params: args,
            }))
        if ('error' in r) {
          throw new (class extends Error {
            readonly code = r.error.code
            readonly data = r.error.data
            constructor() {
              super(r.error.message)
            }
          })()
        }
        return r.result
      }
    },
  }) as any
}
