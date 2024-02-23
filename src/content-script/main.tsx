import { render } from 'preact'
import './style.css'
import { Signal, signal, useSignal, useSignalEffect } from '@preact/signals'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { useMount } from 'react-use'
import { wait } from '@liuli-util/async'
import { register } from '../utils/ext'
import { ContentChannel } from './model'
import css from './style.css?inline'
import CloseSvg from '../assets/close.svg?react'

const CHATGPT_SPLITTER_MODAL_ID = 'chatgpt-splitter-modal'

function canSend() {
  const $sendButton = document.querySelector('[data-testid="send-button"]')
  if (!$sendButton) {
    return false
  }
  return true
}

function sendPrompt(text: string) {
  if (!canSend()) {
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
}

function useStorageSignal<T>(key: string, defaultValue: T): Signal<T> {
  const value = localStorage.getItem(key)
  const state = useSignal<T>(value === null ? defaultValue : JSON.parse(value))
  useMount(() => {
    if (localStorage.getItem(key)) {
      state.value = JSON.parse(localStorage.getItem(key) as string)
    }
  })
  useSignalEffect(() => {
    localStorage.setItem(key, JSON.stringify(state.value))
  })
  return state
}

const progress = signal({
  current: 0,
  status: 'idle' as 'idle' | 'pending' | 'done',
})

function onStop() {
  progress.value = { ...progress.value, status: 'idle' }
  const $stopButton = document.querySelector(
    'button[aria-label="Stop generating"]',
  )
  if (!$stopButton) {
    return
  }
  $stopButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function App() {
  const inupt = useSignal('')
  const limit = useStorageSignal('CHATGPT_SPLITTER_CHUNK_LIMIT', 0)
  const chunks = useSignal<string[]>([])

  useSignalEffect((async () => {
    if (inupt.value.trim().length === 0 || limit.value === 0) {
      chunks.value = []
      return
    }
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
      chunkSize: limit.value,
      chunkOverlap: 0,
    })
    chunks.value = await splitter.splitText(inupt.value)
  }) as any)
  useMount(() => (progress.value = { current: 0, status: 'idle' }))
  async function onStart() {
    if (chunks.value.length === 0) {
      return
    }
    progress.value = { ...progress.value, status: 'pending' }
    for (let i = 0; i < chunks.value.length; i++) {
      if (progress.value.status === 'idle') {
        return
      }
      const it = chunks.value[i]
      sendPrompt(it)
      progress.value = { current: i, status: 'pending' }
      await wait(() => !canSend())
      await wait(canSend)
    }
    progress.value = { ...progress.value, status: 'done' }
  }

  function onClose() {
    progress.value = { ...progress.value, status: 'idle' }
    const $modal = document.getElementById(CHATGPT_SPLITTER_MODAL_ID)
    if ($modal) {
      $modal.remove()
    }
  }
  return (
    <div
      class={'fixed right-0 w-1/4 max-w-sm'}
      style={{
        top: '4rem',
      }}
    >
      <style>{css}</style>
      <div
        class={
          'relative bg-white text-black dark:bg-gray-700 dark:text-white p-4 rounded-md'
        }
      >
        <div>
          <label class={'font-bold size-6'}>ChatGPT Splitter</label>
          <textarea
            value={inupt.value}
            onInput={(ev) =>
              (inupt.value = (ev.target as HTMLTextAreaElement).value)
            }
            rows={10}
            class={
              'bg-white text-black dark:bg-gray-700 dark:text-white w-full'
            }
          ></textarea>
        </div>
        <div class={'mb-2'}>
          <div>
            <label id={'limit'} class={'flex justify-between'}>
              <span>Split Limit:</span>
              <span class={'text-gray-300'}>chunks: {chunks.value.length}</span>
            </label>
          </div>
          <input
            htmlFor={'limit'}
            type={'number'}
            min={0}
            value={limit.value}
            onChange={(ev) =>
              (limit.value = Number.parseInt(
                (ev.target as HTMLInputElement).value,
              ))
            }
            class={'bg-white text-black dark:bg-gray-700 dark:text-white'}
          ></input>
        </div>
        <footer>
          {progress.value.status === 'pending' ? (
            <button
              class={
                'rounded px-4 py-1 bg-red-500 dark:bg-red-500 text-white dark:text-white'
              }
              onClick={onStop}
            >
              Stop prompt
            </button>
          ) : (
            <button
              class={
                'rounded px-4 py-1 bg-blue-500 dark:bg-blue-500 text-white dark:text-white'
              }
              onClick={onStart}
            >
              Auto prompt
            </button>
          )}
          {progress.value.status === 'pending' && (
            <div>
              Progress: {progress.value.current + 1}/{chunks.value.length}
            </div>
          )}
        </footer>

        <button onClick={onClose} class={'absolute right-0 top-0 p-2'}>
          <CloseSvg fill="currentColor" class={'w-4 h-4'} />
        </button>
      </div>
    </div>
  )
}

function onCreateModal() {
  if (document.getElementById(CHATGPT_SPLITTER_MODAL_ID)) {
    document.getElementById(CHATGPT_SPLITTER_MODAL_ID).remove()
  }
  const $modal = document.createElement('div')
  $modal.id = CHATGPT_SPLITTER_MODAL_ID
  $modal.classList.add('chatgpt-splitter')
  document.body.append($modal)
  render(<App />, $modal)
}

const unregister = register<ContentChannel>({
  name: 'content',
  async toggle() {
    if (document.getElementById(CHATGPT_SPLITTER_MODAL_ID)) {
      onStop()
      document.getElementById(CHATGPT_SPLITTER_MODAL_ID).remove()
      return
    }
    onCreateModal()
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(unregister)
  import.meta.hot.dispose(unregister)
}

Reflect.set(globalThis, 'sendPrompt', sendPrompt)
Reflect.set(globalThis, 'canSend', canSend)
