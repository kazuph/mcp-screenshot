# MCP Screenshot

A Model Context Protocol server that provides screenshot and OCR capabilities for macOS.

## Features

- Take screenshots of specific regions (left half, right half, or full screen)
- Automatically save screenshots to dated folders in Downloads directory
- Perform OCR on captured screenshots
- Return OCR text results

## Installation

```bash
npm install -g @kazuph/mcp-screenshot
```

## Configuration

Add the following to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "npx",
      "args": ["-y", "@kazuph/mcp-screenshot"],
      "disabled": false
    }
  }
}
```

### Required Setup

1. Enable Screen Recording for Claude:
   - Open System Settings
   - Go to Privacy & Security > Screen Recording
   - Click the "+" button
   - Add Claude from your Applications folder
   - Turn ON the toggle for Claude

2. Enable Accessibility for Claude:
   - Open System Settings
   - Go to Privacy & Security > Accessibility
   - Click the "+" button
   - Add Claude from your Applications folder
   - Turn ON the toggle for Claude

## Usage

The server provides a `capture` tool with the following options:

- `region`: Specify which part of the screen to capture
  - `"left"`: Capture left half of the screen (default)
  - `"right"`: Capture right half of the screen
  - `"full"`: Capture entire screen

Screenshots are automatically saved to a dated folder in your Downloads directory (e.g., `~/Downloads/20240119/`).

## Development

```bash
# Clone the repository
git clone https://github.com/kazuph/mcp-screenshot.git
cd mcp-screenshot

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## License

MIT
