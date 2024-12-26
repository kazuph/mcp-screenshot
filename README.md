# MCP Screenshot

An MCP server that captures screenshots and performs OCR text recognition.

<a href="https://glama.ai/mcp/servers/vcnmmaejv8"><img width="380" height="200" src="https://glama.ai/mcp/servers/vcnmmaejv8/badge" alt="mcp-screenshot MCP server" /></a>

## Features

- Screenshot capture (left half, right half, full screen)
- OCR text recognition (supports Japanese and English)
- Multiple output formats (JSON, Markdown, vertical, horizontal)

## OCR Engines

This server uses two OCR engines:

1. [yomitoku](https://github.com/kazuph/yomitoku)
   - Primary OCR engine
   - High-accuracy Japanese text recognition
   - Runs as an API server

2. [Tesseract.js](https://github.com/naptha/tesseract.js)
   - Fallback OCR engine
   - Used when yomitoku is unavailable
   - Supports both Japanese and English recognition

## Installation

```bash
npx -y @kazuph/mcp-screenshot
```

## Claude Desktop Configuration

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "npx",
      "args": ["-y", "@kazuph/mcp-screenshot"],
      "env": {
        "OCR_API_URL": "http://localhost:8000"  // yomitoku API base URL
      }
    }
  }
}
```

## Environment Variables

| Variable Name | Description | Default Value |
|--------------|-------------|---------------|
| OCR_API_URL | yomitoku API base URL | http://localhost:8000 |

## Usage Example

You can use it by instructing Claude like this:

```
Please take a screenshot of the left half of the screen and recognize the text in it.
```

## Tool Specification

### capture

Takes a screenshot and performs OCR.

Options:
- `region`: Screenshot area ('left'/'right'/'full', default: 'left')
- `format`: Output format ('json'/'markdown'/'vertical'/'horizontal', default: 'markdown')

## License

MIT

## Author

kazuph
