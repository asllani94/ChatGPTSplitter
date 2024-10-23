import './style.css';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { useLocalStorage, useMount } from 'react-use';
import { difference } from 'lodash-es';
import { createRoot } from 'react-dom/client';
import clsx from 'clsx';
import { onMessage } from '../model/messaging';
import { useEffect, useState, useReducer } from 'react';

interface ButtonsState {
  [key: string]: boolean;
}

const INSTRUCTION_TEXT = `
The total length of the content that I want to send you is too large to send in only one piece.
For sending you that content, I will follow this rule:
[START PART 1/{totalParts}]
this is the content of the part 1 out of {totalParts} in total
[END PART 1/{totalParts}]
Then you just answer: "Received part 1/{totalParts}"
And when I tell you "ALL PARTS SENT", then you can continue processing the data and answering my requests.
`;

const COMPLETION_MARKER = '\nALL PARTS SENT';

// Utility function to calculate the marker size
function getMarkerSize(partNum: number, totalParts: number, isLastPart = false): number {
  const baseSize = `[START PART ${partNum}/${totalParts}]\n\n[END PART ${partNum}/${totalParts}]`.length;
  return isLastPart ? baseSize + COMPLETION_MARKER.length : baseSize;
}

// Hook for splitting text into chunks
function useChunks(text: string, limit: number) {
  const [chunks, setChunks] = useState<string[]>([]);

  useEffect(() => {
    if (!text.trim() || limit <= 0) {
      setChunks([]);
      return;
    }

    const splitText = async () => {
      try {
        const estimateSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: limit,
          chunkOverlap: 0,
          separators: difference(
            RecursiveCharacterTextSplitter.getSeparatorsForLanguage('markdown'),
            ['\n\n***\n\n', '\n\n---\n\n', '\n\n___\n\n'],
          ),
        });

        const estimatedChunks = await estimateSplitter.splitText(text);
        const needsInstructions = estimatedChunks.length > 1;
        const totalParts = needsInstructions ? estimatedChunks.length + 1 : estimatedChunks.length;
        const maxMarkerSize = getMarkerSize(totalParts, totalParts, true);
        const adjustedLimit = limit - maxMarkerSize;

        if (adjustedLimit <= 0) throw new Error('Limit too small after accounting for markers');

        const finalSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: adjustedLimit,
          chunkOverlap: 0,
          separators: estimateSplitter.separators,
        });

        const contentChunks = await finalSplitter.splitText(text);
        const isValid = contentChunks.every((chunk, index) => {
          const isLast = index === contentChunks.length - 1;
          const markerSize = getMarkerSize(totalParts, totalParts, isLast);
          return chunk.length + markerSize <= limit;
        });

        if (!isValid) throw new Error('Some chunks would exceed limit with markers');

        const instructions = needsInstructions
          ? INSTRUCTION_TEXT.replace(/\{totalParts\}/g, String(totalParts))
          : '';
        setChunks(instructions ? [instructions, ...contentChunks] : contentChunks);
      } catch (error) {
        console.error(error.message);
        setChunks([]);
      }
    };

    splitText();
  }, [text, limit]);

  return chunks;
}

function App() {
  const [text, setText] = useState('');
  const [rawLimit, setLimit] = useLocalStorage('CHATGPT_SPLITTER_CHUNK_LIMIT', 8000);
  const limit = Number(rawLimit ?? 8000);

  const chunks = useChunks(text, limit);
  const [buttonsState, setButtonsState] = useState<ButtonsState>({});
  const [hide, toggle] = useReducer((state) => !state, true);

  useEffect(() => {
    const initialState: ButtonsState = {};
    chunks.forEach((_, index) => {
      initialState[`button_${index}`] = false;
    });
    setButtonsState(initialState);
  }, [chunks]);

  const disableButton = (id: string) => {
    setButtonsState((prevState) => ({
      ...prevState,
      [id]: true,
    }));
  };

  const formatChunkWithParts = (chunk: string, index: number, total: number, isLastChunk = false): string => {
    const formattedChunk = `[START PART ${index + 1}/${total}]\n${chunk}\n[END PART ${index + 1}/${total}]`;
    return isLastChunk ? formattedChunk + COMPLETION_MARKER : formattedChunk;
  };

  const copyToClipboard = (chunk: string, index: number) => {
    const isLastChunk = index === chunks.length - 1;
    const formattedChunk = formatChunkWithParts(chunk, index, chunks.length, isLastChunk);
    navigator.clipboard.writeText(formattedChunk).then(() => {
      disableButton(`button_${index}`);
    });
  };

  useMount(() => {
    onMessage('toggle', toggle);
  });

  return (
    <div
      className={clsx('fixed right-0 w-1/4 max-w-sm', { hidden: hide })}
      style={{ top: '4rem' }}
    >
      <div className="relative bg-white text-black dark:bg-gray-700 dark:text-white p-4 rounded-md">
        <div>
          <label className="font-bold size-6">LLM Splitter</label>
          <textarea
            value={text}
            onChange={(ev) => setText(ev.target.value)}
            rows={10}
            className="bg-white text-black dark:bg-gray-700 dark:text-white w-full border border-gray-300 rounded-md p-2 outline-none"
          />
        </div>

        <div className="mb-2">
          <label className="flex justify-between">
            <span>Split Limit:</span>
            <span className="text-gray-300">
              chunks: {chunks.length}
              {chunks.length > 0 && ` (markers: ${getMarkerSize(chunks.length, chunks.length, true)})`}
            </span>
          </label>
          <input
            type="number"
            min={50}
            value={limit}
            onChange={(ev) => setLimit(Number(ev.target.value))}
            className="bg-white text-black dark:bg-gray-700 dark:text-white border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[30vh]">
          {chunks.map((chunk, index) => (
            <div key={index} className="mb-2">
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

        <button onClick={toggle} className="absolute right-0 top-0 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  main(ctx) {
    console.log('Hello content.');

    async function onCreateModal() {
      const ui = await createShadowRootUi(ctx, {
        name: 'llm-splitter',
        position: 'inline',
        onMount: (container) => {
          const app = document.createElement('div');
          container.append(app);

          const root = createRoot(app);
          root.render(<App />);
          return root;
        },
        onRemove(root) {
          root?.unmount();
        },
      });
      ui.mount();
    }

    onCreateModal();
  },
});
