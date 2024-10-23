import './style.css'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { useAsyncFn, useLocalStorage, useMount } from 'react-use'
import { difference } from 'lodash-es'
import { wait } from '@liuli-util/async'
import { createRoot } from 'react-dom/client'
import clsx from 'clsx'
import { onMessage } from '../model/messaging'
import { useEffect, useState, useReducer, useCallback } from 'react'

interface ButtonsState {
  [key: string]: boolean;
}

interface PartialMessage {
  content: string;
  partNumber: number;
  totalParts: number;
}

function useChunks(text: string, limit: number | undefined) {
  let emptyStringArray: string[] = [];
  const [chunks, setChunks] = useState(emptyStringArray)

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
  const chunks = useChunks(text, limit)
  const [buttonsState, setButtonsState] = useState<ButtonsState>({})
  const [hide, toggle] = useReducer((state) => !state, true)

  // State for handling partial messages
  const [partialMessages, setPartialMessages] = useState<Record<number, string>>({})
  const [expectedTotalParts, setExpectedTotalParts] = useState<number | null>(null)

  useEffect(() => {
    const initialState: ButtonsState = {};
    chunks.forEach((_, index) => {
      initialState[`button_${index}`] = false;
    });
    setButtonsState(initialState);
  }, [chunks]);

  const disableButton = (id: string) => {
    setButtonsState(prevState => ({
      ...prevState,
      [id]: true
    }));
  };

  // Calculate the overhead length of part markers
  const getPartMarkersLength = (partNum: number, totalParts: number): number => {
    return `[START PART ${partNum}/${totalParts}]\n\n[END PART ${partNum}/${totalParts}]`.length;
  };

  // Function to parse a message part
  const parseMessagePart = (text: string): PartialMessage | null => {
    const startMatch = text.match(/\[START PART (\d+)\/(\d+)\]/);
    const endMatch = text.match(/\[END PART \d+\/\d+\]/);

    if (!startMatch || !endMatch) return null;

    const partNumber = parseInt(startMatch[1]);
    const totalParts = parseInt(startMatch[2]);
    const content = text.slice(
      startMatch[0].length,
      text.length - endMatch[0].length
    ).trim();

    return { content, partNumber, totalParts };
  };

  // Function to generate message parts that respect the size limit
  const generateMessageParts = useCallback((text: string, chunkLimit: number): string[] => {
    const parts: string[] = [];
    let remainingText = text;

    while (remainingText.length > 0) {
      // Calculate how many parts we might need (estimate)
      const estimatedTotalParts = Math.ceil(remainingText.length / (chunkLimit - 50)); // 50 chars buffer for markers

      // Calculate actual available space for content in this part
      const markersLength = getPartMarkersLength(parts.length + 1, estimatedTotalParts);
      const availableSpace = chunkLimit - markersLength;

      // Get content that fits
      const content = remainingText.slice(0, availableSpace);
      remainingText = remainingText.slice(availableSpace);

      // Create the part with proper markers
      const part = `[START PART ${parts.length + 1}/${estimatedTotalParts}]\n${content}\n[END PART ${parts.length + 1}/${estimatedTotalParts}]`;
      parts.push(part);

      // If we need to recalculate total parts
      if (remainingText.length > 0) {
        // Recalculate parts array with updated total count
        const actualTotalParts = parts.length + Math.ceil(remainingText.length / (chunkLimit - 50));
        parts[parts.length - 1] = `[START PART ${parts.length}/${actualTotalParts}]\n${content}\n[END PART ${parts.length}/${actualTotalParts}]`;
      }
    }

    // Final pass to ensure all parts have correct total
    const totalParts = parts.length;
    return parts.map((part, index) => {
      const content = part.match(/\n(.*)\n\[END/s)?.[1] || '';
      return `[START PART ${index + 1}/${totalParts}]\n${content}\n[END PART ${index + 1}/${totalParts}]`;
    });
  }, []);

  // Function to handle text input and potentially split it into parts
  const handleTextInput = (inputText: string) => {
    // Check if this is a part of a multi-part message
    const parsedPart = parseMessagePart(inputText);

    if (parsedPart) {
      // This is a part of a multi-part message
      setPartialMessages(prev => ({
        ...prev,
        [parsedPart.partNumber]: parsedPart.content
      }));
      setExpectedTotalParts(parsedPart.totalParts);

      // If this completes the message, combine all parts
      const updatedMessages = {
        ...partialMessages,
        [parsedPart.partNumber]: parsedPart.content
      };

      if (Object.keys(updatedMessages).length === parsedPart.totalParts) {
        const combinedText = Array.from(
          { length: parsedPart.totalParts },
          (_, i) => updatedMessages[i + 1]
        ).join('');
        setText(combinedText);
        setPartialMessages({});
        setExpectedTotalParts(null);
      }
    } else {
      // This is a regular input
      setText(inputText);
    }
  };

  function copyToClipboard(text: string, index: number) {
    if (!limit) {
      console.error('Chunk size limit not set');
      return;
    }

    const parts = generateMessageParts(text, limit);

    // Verify that no part exceeds the limit
    const oversizedParts = parts.filter(part => part.length > limit);
    if (oversizedParts.length > 0) {
      console.error(`${oversizedParts.length} parts exceed the size limit`);
      return;
    }

    navigator.clipboard.writeText(parts[0]).then(() => {
      disableButton(`button_${index}`);
    });
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
              handleTextInput((ev.target as HTMLTextAreaElement).value)
            }}
            rows={10}
            className={
              'bg-white text-black dark:bg-gray-700 dark:text-white w-full border border-gray-300 rounded-md p-2 outline-none'
            }
          ></textarea>
        </div>

        {expectedTotalParts && (
          <div className="mt-2 text-sm text-blue-500">
            Received {Object.keys(partialMessages).length} / {expectedTotalParts} parts
          </div>
        )}

        <div className={'mb-2'}>
          <div>
            <label id={'limit'} className={'flex justify-between'}>
              <span>Split Limit:</span>
              <span className={'text-gray-300'}>
                chunks: {chunks.length}
              </span>
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

        <div>
          {chunks.map((chunk, index) => (
            <div key={index} className={'mb-2'}>
              <button
                className={clsx(
                  'rounded px-4 py-1 mt-2 transition-colors duration-200',
                  buttonsState[`button_${index}`]
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                )}
                onClick={() => copyToClipboard(chunk, index)}
                disabled={buttonsState[`button_${index}`]}
              >
                Copy {index + 1} / {chunks.length}
              </button>
            </div>
          ))}
        </div>

        <button onClick={toggle} className={'absolute right-0 top-0 p-2'}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className={'w-4 h-4'}
          >
            <path
              d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default App