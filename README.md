# LLM Splitter

> This is a fork of [ChatGPTSplitter](https://github.com/rxliuli/ChatGPTSplitter) by [rxliuli](https://github.com/rxliuli), enhanced with Microsoft Copilot support and other improvements.

A browser extension that automatically splits long texts and seamlessly inputs them into ChatGPT or Microsoft Copilot, allowing you to process content that exceeds AI's token limit.

## Prerequisites

1. Install Node.js (version 22 or higher) from [nodejs.org](https://nodejs.org/)

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
- ⚡ Works directly in the ChatGPT or Microsoft Copilot interface
- 📝 Maintains text coherence across splits
- 🎯 Smart splitting using LangChain text splitters
- 🖥️ Support for Chrome and Firefox browsers

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/asllani94/chatgpt-splitter.git
cd chatgpt-splitter
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

### From Release

Download the latest release for your browser from the [Releases](https://github.com/asllani94/chatgpt-splitter/releases) page.

## Development

This extension is built using:
- [WXT](https://wxt.dev) - Modern Web Extension Framework
- React - UI Framework
- TypeScript - Type Safety
- Tailwind CSS - Styling
- LangChain - Text Processing

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
chatgpt-splitter/
├── src/
│   ├── components/    # React components
│   ├── entrypoints/  # Extension entry points
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
├── public/           # Static assets
└── wxt.config.ts     # WXT configuration
```

## Configuration

The extension can be configured through the options page:
1. Right-click the extension icon
2. Select "Options" or "Extension Options"
3. Adjust settings for:
    - Maximum chunk size
    - Overlap between chunks
    - Split strategy
    - Custom delimiters

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`pnpm install`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original project: [ChatGPTSplitter](https://github.com/rxliuli/ChatGPTSplitter) by [rxliuli](https://github.com/rxliuli)
- Built with [WXT](https://wxt.dev)
- Uses [LangChain](https://js.langchain.com) for text processing
- Inspired by the need to work with large texts in ChatGPT and Microsoft Copilot

## Version History

- 0.5.0 - Current version
    - Removed POM support
    - Added Microsoft Copilot support

## Support

For support, please:
1. Check the [Issues](https://github.com/asllani94/chatgpt-splitter/issues) page
2. Create a new issue if your problem isn't already reported

---

*Made with ❤️ by [Arnold Asllani]*