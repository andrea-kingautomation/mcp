# Supadata MCP Server

A Model Context Protocol (MCP) server implementation that integrates with [Supadata](https://supadata.ai) for web scraping capabilities.

## Features

- Web scraping, crawling, and discovery
- Search and content extraction
- Batch scraping
- Automatic retries and rate limiting
- SSE support

> Play around with [our MCP Server on MCP.so's playground](https://mcp.so/playground?server=supadata-mcp) or on [Klavis AI](https://www.klavis.ai/mcp-servers).

## Installation

### Running with npx

```bash
env SUPADATA_API_KEY=your-api-key npx -y supadata-mcp
```

### Manual Installation

```bash
npm install -g supadata-mcp
```

### Running on Cursor

Configuring Cursor 🖥️
Note: Requires Cursor version 0.45.6+
For the most up-to-date configuration instructions, please refer to the official Cursor documentation on configuring MCP servers:
[Cursor MCP Server Configuration Guide](https://docs.cursor.com/context/model-context-protocol#configuring-mcp-servers)

To configure Supadata MCP in Cursor **v0.48.6**

1. Open Cursor Settings
2. Go to Features > MCP Servers
3. Click "+ Add new global MCP server"
4. Enter the following code:
   ```json
   {
     "mcpServers": {
       "supadata-mcp": {
         "command": "npx",
         "args": ["-y", "supadata-mcp"],
         "env": {
           "SUPADATA_API_KEY": "YOUR-API-KEY"
         }
       }
     }
   }
   ```

To configure Supadata MCP in Cursor **v0.45.6**

1. Open Cursor Settings
2. Go to Features > MCP Servers
3. Click "+ Add New MCP Server"
4. Enter the following:
   - Name: "supadata-mcp" (or your preferred name)
   - Type: "command"
   - Command: `env SUPADATA_API_KEY=your-api-key npx -y supadata-mcp`

> If you are using Windows and are running into issues, try `cmd /c "set SUPADATA_API_KEY=your-api-key && npx -y supadata-mcp"`

Replace `your-api-key` with your Supadata API key. If you don't have one yet, you can create an account and get it from https://www.supadata.dev/app/api-keys

After adding, refresh the MCP server list to see the new tools. The Composer Agent will automatically use Supadata MCP when appropriate, but you can explicitly request it by describing your web scraping needs. Access the Composer via Command+L (Mac), select "Agent" next to the submit button, and enter your query.

### Running on Windsurf

Add this to your `./codeium/windsurf/model_config.json`:

```json
{
  "mcpServers": {
    "mcp-server-supadata": {
      "command": "npx",
      "args": ["-y", "supadata-mcp"],
      "env": {
        "SUPADATA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Installing via Smithery

To install Supadata for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@supadata-ai/mcp):

```bash
npx -y @smithery/cli install @supadata-ai/mcp --client claude
```

### Running on VS Code

For one-click installation, click one of the install buttons below...

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=supadata&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22Supadata%20API%20Key%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22supadata-mcp%22%5D%2C%22env%22%3A%7B%22SUPADATA_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=supadata&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22Supadata%20API%20Key%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22supadata-mcp%22%5D%2C%22env%22%3A%7B%22SUPADATA_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D&quality=insiders)

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "apiKey",
        "description": "Supadata API Key",
        "password": true
      }
    ],
    "servers": {
      "supadata": {
        "command": "npx",
        "args": ["-y", "supadata-mcp"],
        "env": {
          "SUPADATA_API_KEY": "${input:apiKey}"
        }
      }
    }
  }
}
```

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "apiKey",
      "description": "Supadata API Key",
      "password": true
    }
  ],
  "servers": {
    "supadata": {
      "command": "npx",
      "args": ["-y", "supadata-mcp"],
      "env": {
        "SUPADATA_API_KEY": "${input:apiKey}"
      }
    }
  }
}
```

## Configuration

### Environment Variables

- `SUPADATA_API_KEY`: Your Supadata API key

#### Optional Configuration

##### Retry Configuration

- `SUPADATA_RETRY_MAX_ATTEMPTS`: Maximum number of retry attempts (default: 3)
- `SUPADATA_RETRY_INITIAL_DELAY`: Initial delay in milliseconds before first retry (default: 1000)
- `SUPADATA_RETRY_MAX_DELAY`: Maximum delay in milliseconds between retries (default: 10000)
- `SUPADATA_RETRY_BACKOFF_FACTOR`: Exponential backoff multiplier (default: 2)

##### Credit Usage Monitoring

- `SUPADATA_CREDIT_WARNING_THRESHOLD`: Credit usage warning threshold (default: 1000)
- `SUPADATA_CREDIT_CRITICAL_THRESHOLD`: Credit usage critical threshold (default: 100)

### Configuration Examples

Example configuration with custom retry and credit monitoring:

```bash
# API key
export SUPADATA_API_KEY=your-api-key

# Optional retry configuration
export SUPADATA_RETRY_MAX_ATTEMPTS=5        # Increase max retry attempts
export SUPADATA_RETRY_INITIAL_DELAY=2000    # Start with 2s delay
export SUPADATA_RETRY_MAX_DELAY=30000       # Maximum 30s delay
export SUPADATA_RETRY_BACKOFF_FACTOR=3      # More aggressive backoff

# Optional credit monitoring
export SUPADATA_CREDIT_WARNING_THRESHOLD=2000    # Warning at 2000 credits
export SUPADATA_CREDIT_CRITICAL_THRESHOLD=500    # Critical at 500 credits
```

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-server-supadata": {
      "command": "npx",
      "args": ["-y", "supadata-mcp"],
      "env": {
        "SUPADATA_API_KEY": "YOUR_API_KEY_HERE",

        "SUPADATA_RETRY_MAX_ATTEMPTS": "5",
        "SUPADATA_RETRY_INITIAL_DELAY": "2000",
        "SUPADATA_RETRY_MAX_DELAY": "30000",
        "SUPADATA_RETRY_BACKOFF_FACTOR": "3",

        "SUPADATA_CREDIT_WARNING_THRESHOLD": "2000",
        "SUPADATA_CREDIT_CRITICAL_THRESHOLD": "500"
      }
    }
  }
}
```

### System Configuration

The server includes several configurable parameters that can be set via environment variables. Here are the default values if not configured:

```typescript
const CONFIG = {
  retry: {
    maxAttempts: 3, // Number of retry attempts for rate-limited requests
    initialDelay: 1000, // Initial delay before first retry (in milliseconds)
    maxDelay: 10000, // Maximum delay between retries (in milliseconds)
    backoffFactor: 2, // Multiplier for exponential backoff
  },
};
```

These configurations control:

1. **Retry Behavior**
   - Automatically retries failed requests due to rate limits
   - Uses exponential backoff to avoid overwhelming the API
   - Example: With default settings, retries will be attempted at:
     - 1st retry: 1 second delay
     - 2nd retry: 2 seconds delay
     - 3rd retry: 4 seconds delay (capped at maxDelay)

2. **Credit Usage Monitoring**
   - Tracks API credit consumption
   - Provides warnings at specified thresholds
   - Helps prevent unexpected service interruption
   - Example: With default settings:
     - Warning at 1000 credits remaining
     - Critical alert at 100 credits remaining

### Rate Limiting and Batch Processing

The server utilizes Supadata's built-in rate limiting and batch processing capabilities:

- Automatic rate limit handling with exponential backoff
- Efficient parallel processing for batch operations
- Smart request queuing and throttling
- Automatic retries for transient errors

## How to Choose a Tool

Use this guide to select the right tool for your task:

- **If you know the exact URL(s) you want:**
  - For one: use **scrape**
  - For many: use **batch_scrape**
- **If you need to discover URLs on a site:** use **map**
- **If you want to analyze a whole site or section:** use **crawl** (with limits!)

### Quick Reference Table

| Tool   | Best for                            | Returns         |
| ------ | ----------------------------------- | --------------- |
| scrape | Single page content                 | markdown/html   |
| map    | Discovering URLs on a site          | URL[]           |
| crawl  | Multi-page extraction (with limits) | markdown/html[] |

## Available Tools

### 1. Scrape Tool (`supadata_scrape`)

Scrape content from a single URL with advanced options.

**Best for:**

- Single page content extraction, when you know exactly which page contains the information.

**Not recommended for:**

- Extracting content from multiple pages (use batch_scrape for known URLs, or map + batch_scrape to discover URLs first, or crawl for full page content)

**Common mistakes:**

- Using scrape for a list of URLs (use batch_scrape instead).

**Prompt Example:**

> "Get the content of the page at https://example.com."

**Usage Example:**

```json
{
  "name": "supadata_scrape",
  "arguments": {
    "url": "https://example.com",
    "formats": ["markdown"],
    "onlyMainContent": true,
    "waitFor": 1000,
    "timeout": 30000,
    "mobile": false,
    "includeTags": ["article", "main"],
    "excludeTags": ["nav", "footer"],
    "skipTlsVerification": false
  }
}
```

**Returns:**

- Markdown, HTML, or other formats as specified.

### 2. Map Tool (`supadata_map`)

Map a website to discover all indexed URLs on the site.

**Best for:**

- Discovering URLs on a website before deciding what to scrape
- Finding specific sections of a website

**Not recommended for:**

- When you already know which specific URL you need (use scrape or batch_scrape)
- When you need the content of the pages (use scrape after mapping)

**Common mistakes:**

- Using crawl to discover URLs instead of map

**Prompt Example:**

> "List all URLs on example.com."

**Usage Example:**

```json
{
  "name": "supadata_map",
  "arguments": {
    "url": "https://example.com"
  }
}
```

**Returns:**

- Array of URLs found on the site

### 3. Crawl Tool (`supadata_crawl`)

Starts an asynchronous crawl job on a website and extract content from all pages.

**Best for:**

- Extracting content from multiple related pages, when you need comprehensive coverage.

**Not recommended for:**

- Extracting content from a single page (use scrape)
- When token limits are a concern (use map + batch_scrape)
- When you need fast results (crawling can be slow)

**Warning:** Crawl responses can be very large and may exceed token limits. Limit the crawl depth and number of pages, or use map + batch_scrape for better control.

**Common mistakes:**

- Setting limit or maxDepth too high (causes token overflow)
- Using crawl for a single page (use scrape instead)

**Prompt Example:**

> "Get all blog posts from the first two levels of example.com/blog."

**Usage Example:**

```json
{
  "name": "supadata_crawl",
  "arguments": {
    "url": "https://example.com/blog/*",
    "maxDepth": 2,
    "limit": 100,
    "allowExternalLinks": false,
    "deduplicateSimilarURLs": true
  }
}
```

**Returns:**

- Response includes operation ID for status checking:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Started crawl for: https://example.com/* with job ID: 550e8400-e29b-41d4-a716-446655440000. Use supadata_check_crawl_status to check progress."
    }
  ],
  "isError": false
}
```

### 4. Check Crawl Status (`supadata_check_crawl_status`)

Check the status of a crawl job.

```json
{
  "name": "supadata_check_crawl_status",
  "arguments": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Returns:**

- Response includes the status of the crawl job with details on completion progress and results.

## Logging System

The server includes comprehensive logging:

- Operation status and progress
- Performance metrics
- Credit usage monitoring
- Rate limit tracking
- Error conditions

Example log messages:

```
[INFO] Supadata MCP Server initialized successfully
[INFO] Starting scrape for URL: https://example.com
[INFO] Batch operation queued with ID: batch_1
[WARNING] Credit usage has reached warning threshold
[ERROR] Rate limit exceeded, retrying in 2s...
```

## Error Handling

The server provides robust error handling:

- Automatic retries for transient errors
- Rate limit handling with backoff
- Detailed error messages
- Credit usage warnings
- Network resilience

Example error response:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Rate limit exceeded. Retrying in 2 seconds..."
    }
  ],
  "isError": true
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `npm test`
4. Submit a pull request

### Thanks to contributors

Thanks to [@vrknetha](https://github.com/vrknetha), [@cawstudios](https://caw.tech) for the initial implementation!

Thanks to MCP.so and Klavis AI for hosting and [@gstarwd](https://github.com/gstarwd), [@xiangkaiz](https://github.com/xiangkaiz) and [@zihaolin96](https://github.com/zihaolin96) for integrating our server.

## License

MIT License - see LICENSE file for details
