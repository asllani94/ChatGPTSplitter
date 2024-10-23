# LLM Splitter

A browser extension that helps you handle long texts in ChatGPT by automatically splitting them into properly formatted chunks and adding clear instructions for sequential processing. It makes it easy to copy and paste content that exceeds AI's token limit.

## Prerequisites

1. Install Node.js (version 18 or higher) from [nodejs.org](https://nodejs.org/)

2. Install pnpm:
   ```bash
   # Using npm
   npm install -g pnpm

   # Using curl for POSIX systems (Linux/macOS)
   curl -fsSL https://get.pnpm.io/install.sh | sh -

   # Using Homebrew on macOS
   brew install pnpm

   # Using Scoop on Windows
   scoop install pnpm

   # Using Chocolatey on Windows
   choco install pnpm
   ```

3. Verify installation:
   ```bash
   pnpm --version
   ```

## Features

- 🔄 Automatically splits long texts while preserving context
- 📝 Maintains text coherence across splits
- 🎯 Smart splitting using LangChain text splitters
- 🖥️ Support for Chrome and Firefox browsers

## Installation

### From Source

1. Clone the repository:
```bash
git https://github.com/asllani94/LLMSplitter.git
cd LLMSplitter
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension:
```bash
# For Chrome
pnpm build

# For Firefox
pnpm build:firefox
```

4. Load the extension:
- **Chrome**: Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked". Select the `dist` directory.
- **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file from the `dist` directory.

## Development

This extension is built using:
- [WXT](https://wxt.dev) v0.19.1 - Modern Web Extension Framework
- React 18.3.1 - UI Framework
- TypeScript 5.5.4 - Type Safety
- Tailwind CSS 3.4.10 - Styling
- LangChain 0.2.16 - Text Processing

### Dependencies

Key dependencies include:
- `@liuli-util/async` - Async utilities
- `@preact/signals-react` - State management
- `@webext-core/messaging` - Extension messaging
- `langchain` - Text processing and splitting
- `lodash-es` - Utility functions
- `react` and `react-dom` - UI framework
- `react-use` - React hooks collection

### Available Scripts

- `pnpm dev` - Start development server for Chrome
- `pnpm dev:firefox` - Start development server for Firefox
- `pnpm build` - Build for Chrome
- `pnpm build:firefox` - Build for Firefox
- `pnpm zip` - Package Chrome extension
- `pnpm zip:firefox` - Package Firefox extension
- `pnpm compile` - Type check TypeScript
- `pnpm postinstall` - Prepare WXT

### Project Structure

```
llm-splitter/
├── src/
│   ├── components/    # React components
│   ├── entrypoints/  # Extension entry points
│   └── model/        # Extension logic
├── public/           # Static assets
└── wxt.config.ts     # WXT configuration
```

## How It Works

1. The extension adds a UI panel to split long texts
2. Text is processed using LangChain's `RecursiveCharacterTextSplitter`
3. Content is split into manageable chunks while preserving context
4. Each chunk is formatted with proper markers for sequential processing
5. Chunks can be copied to clipboard for pasting into ChatGPT, Claude, MS Copilot or any other AI Chat

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`pnpm install`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Version

Current version: 1.0.0

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [WXT](https://wxt.dev)
- Uses [LangChain](https://js.langchain.com) for text processing
- Inspired by the need to work with large texts in ChatGPT

## Support

For support, please:
1. Check the Issues page
2. Create a new issue if your problem isn't already reported

---

*Made with ❤️ by [Arnold Asllani]*