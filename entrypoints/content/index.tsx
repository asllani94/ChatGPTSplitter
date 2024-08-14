import './style.css'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { useAsyncFn, useLocalStorage, useMount } from 'react-use'
import { chatgpt } from './chatgpt'
import { poe } from './poe'
import { difference } from 'lodash-es'
import { wait } from '@liuli-util/async'
import { createRoot } from 'react-dom/client'
import clsx from 'clsx'
import { onMessage } from '../model/messaging'

function useChunks(text: string, limit: number) {
  const [chunks, setChunks] = useState<string[]>([])
  useEffect(() => {
    if (text.trim().length === 0 || limit === 0) {
      setChunks([])
      return
    }
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: limit,
      chunkOverlap: 0,
      separators: difference(
        RecursiveCharacterTextSplitter.getSeparatorsForLanguage('markdown'),
        ['\n\n***\n\n', '\n\n---\n\n', '\n\n___\n\n'],
      ),
    })
    ;(async () => {
      setChunks(await splitter.splitText(text))
    })()
  }, [text, limit])
  return chunks
}

function App() {
  const [text, setText] = useState('')
  const [limit, setLimit] = useLocalStorage('CHATGPT_SPLITTER_CHUNK_LIMIT', 0)
  const chunks = useChunks(text, limit!)
  const [progress, setProgress] = useState(0)
  const [hide, toggle] = useReducer((state) => !state, true)

  function onStop() {
    control?.abort()
    const $stopButton = document.querySelector(
      'button[aria-label="Stop generating"]',
    )
    if (!$stopButton) {
      return
    }
    $stopButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  const [control, setControl] = useState<AbortController>()
  const [state, onStart] = useAsyncFn(async () => {
    if (chunks.length === 0) {
      return
    }
    setProgress(0)
    const control = new AbortController()
    setControl(control)
    for (let i = 0; i < chunks.length; i++) {
      if (control.signal.aborted) {
        new Notification('Send prompt canceled')
        return
      }
      const it = chunks[i]
      const chats = [chatgpt(), poe()]
      const chat = chats.find((it) => location.host === it.domain)
      if (!chat) {
        throw new Error('No chat found')
      }
      await chat.sendPrompt(it)
      setProgress(i)
      await wait(10000)
      await wait(chat.canSend)
    }
    new Notification('Send prompt finished')
  }, [chunks])

  function onClose() {
    control?.abort()
    toggle()
  }

  useMount(() => {
    onMessage('toggle', toggle)
  })

  return (
    <div
      className={clsx('fixed right-0 w-1/4 max-w-sm', { hidden: hide })}
      style={{
        top: '4rem',
      }}
    >
      <div
        className={
          'relative bg-white text-black dark:bg-gray-700 dark:text-white p-4 rounded-md'
        }
      >
        <div>
          <label className={'font-bold size-6'}>ChatGPT Splitter</label>
          <textarea
            value={text}
            onInput={(ev) => {
              setText((ev.target as HTMLTextAreaElement).value)
            }}
            rows={10}
            className={
              'bg-white text-black dark:bg-gray-700 dark:text-white w-full border border-gray-300 rounded-md p-2 outline-none'
            }
          ></textarea>
        </div>
        <div className={'mb-2'}>
          <div>
            <label id={'limit'} className={'flex justify-between'}>
              <span>Split Limit:</span>
              <span className={'text-gray-300'}>chunks: {chunks.length}</span>
            </label>
          </div>
          <input
            id={'limit'}
            type={'number'}
            min={0}
            value={limit}
            onChange={(ev) =>
              setLimit(Number.parseInt((ev.target as HTMLInputElement).value))
            }
            className={
              'bg-white text-black dark:bg-gray-700 dark:text-white border border-gray-300 rounded-md p-2'
            }
          ></input>
        </div>

        <footer>
          {state.loading ? (
            <button
              className={
                'rounded px-4 py-1 bg-red-500 dark:bg-red-500 text-white dark:text-white'
              }
              onClick={onStop}
            >
              Stop prompt
            </button>
          ) : (
            <button
              className={
                'rounded px-4 py-1 bg-blue-500 dark:bg-blue-500 text-white dark:text-white'
              }
              onClick={onStart}
            >
              Send prompt
            </button>
          )}
          {state.loading && (
            <div>
              Progress: {progress + 1}/{chunks.length}
            </div>
          )}
        </footer>

        <button onClick={onClose} className={'absolute right-0 top-0 p-2'}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className={'w-4 h-4'}
          >
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default defineContentScript({
  matches: ['https://chat.openai.com/**', 'https://poe.com/chat/*'],
  cssInjectionMode: 'ui',
  main(ctx) {
    console.log('Hello content.')

    async function onCreateModal() {
      const ui = await createShadowRootUi(ctx, {
        name: 'chatgpt-splitter',
        position: 'inline',
        onMount: (container) => {
          const app = document.createElement('div')
          container.append(app)

          // Create a root on the UI container and render a component
          const root = createRoot(app)
          root.render(<App />)
          return root
        },
        onRemove(root) {
          // Unmount the root when the UI is removed
          root?.unmount()
        },
      })
      ui.mount()
    }

    onCreateModal()
  },
})
