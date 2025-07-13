#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  Tool,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Supadata } from '@supadata/js';
import dotenv from 'dotenv';

dotenv.config();

// Tool definitions
const SCRAPE_TOOL: Tool = {
  name: 'supadata_scrape',
  description: `
Extract content from any web page to Markdown format using Supadata's powerful scraping API.

**Purpose:** Single page content extraction with automatic formatting to Markdown.
**Best for:** When you know exactly which page contains the information you need.
**Pricing:** 1 scrape request = 1 credit.

**Usage Example:**
\`\`\`json
{
  "name": "supadata_scrape",
  "arguments": {
    "url": "https://example.com",
    "noLinks": false,
    "lang": "en"
  }
}
\`\`\`

**Returns:** 
- URL of the scraped page
- Extracted content in Markdown format
- Page name and description
- Character count
- List of URLs found on the page

**Important:** Respect robots.txt and website terms of service when scraping web content.
`,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Web page URL to scrape',
      },
      noLinks: {
        type: 'boolean',
        default: false,
        description: 'When true, removes markdown links from the content',
      },
      lang: {
        type: 'string',
        default: 'en',
        description:
          'Preferred language for the scraped content (ISO 639-1 code)',
      },
    },
    required: ['url'],
  },
};

const MAP_TOOL: Tool = {
  name: 'supadata_map',
  description: `
Crawl a whole website and get all URLs on it using Supadata's mapping API.

**Purpose:** Extract all links found on a website for content discovery and sitemap creation.
**Best for:** Website content discovery, SEO analysis, content aggregation, automated web scraping and indexing.
**Use cases:** Creating a sitemap, running a crawler to fetch content from all pages of a website.
**Pricing:** 1 map request = 1 credit.

**Usage Example:**
\`\`\`json
{
  "name": "supadata_map",
  "arguments": {
    "url": "https://example.com"
  }
}
\`\`\`

**Returns:** Array of URLs found on the website.

**Important:** Respect robots.txt and website terms of service when mapping web content.
`,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL of the website to map',
      },
    },
    required: ['url'],
  },
};

const CRAWL_TOOL: Tool = {
  name: 'supadata_crawl',
  description: `
Create a crawl job to extract content from all pages on a website using Supadata's crawling API.

**Purpose:** Crawl a whole website and get content of all pages on it.
**Best for:** Extracting content from multiple related pages when you need comprehensive coverage.
**Workflow:** 1) Create crawl job → 2) Receive job ID → 3) Check job status and retrieve results
**Pricing:** 1 crawl request = 1 credit, 1 crawled page = 1 credit.

**Crawling Behavior:**
- Follows only child links within the specified domain
- Example: For https://supadata.ai/blog, crawls https://supadata.ai/blog/article-1 but not https://supadata.ai/about
- To crawl entire website, use top-level URL like https://supadata.ai

**Usage Example:**
\`\`\`json
{
  "name": "supadata_crawl",
  "arguments": {
    "url": "https://example.com",
    "limit": 100
  }
}
\`\`\`

**Returns:** Job ID for status checking. Use supadata_check_crawl_status to check progress.
**Job Status:** Possible statuses are 'scraping', 'completed', 'failed', or 'cancelled'

**Important:** Respect robots.txt and website terms of service when crawling web content.
`,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL of the webpage to crawl',
      },
      limit: {
        type: 'number',
        default: 100,
        minimum: 1,
        maximum: 5000,
        description: 'Maximum number of pages to crawl (1-5000, default: 100)',
      },
    },
    required: ['url'],
  },
};

const CHECK_CRAWL_STATUS_TOOL: Tool = {
  name: 'supadata_check_crawl_status',
  description: `
Check the status and retrieve results of a crawl job created with supadata_crawl.

**Purpose:** Monitor crawl job progress and retrieve completed results.
**Workflow:** Use the job ID returned from supadata_crawl to check status and get results.

**Usage Example:**
\`\`\`json
{
  "name": "supadata_check_crawl_status",
  "arguments": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
\`\`\`

**Returns:** 
- Job status: 'scraping', 'completed', 'failed', or 'cancelled'
- For completed jobs: URL, Markdown content, page title, and description for each crawled page
- Progress information and any error details if applicable

**Tip:** Poll this endpoint periodically until status is 'completed' or 'failed'.
`,
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Crawl job ID returned from supadata_crawl',
      },
    },
    required: ['id'],
  },
};

interface StatusCheckOptions {
  id: string;
}

// Type guards for Supadata API
function isScrapeOptions(args: unknown): args is { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isMapOptions(args: unknown): args is { url: string } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isCrawlOptions(
  args: unknown
): args is { url: string; limit?: number } {
  return (
    typeof args === 'object' &&
    args !== null &&
    'url' in args &&
    typeof (args as { url: unknown }).url === 'string'
  );
}

function isStatusCheckOptions(args: unknown): args is StatusCheckOptions {
  return (
    typeof args === 'object' &&
    args !== null &&
    'id' in args &&
    typeof (args as { id: unknown }).id === 'string'
  );
}

// Server implementation
const server = new Server(
  {
    name: 'supadata-mcp',
    version: '1.7.0',
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  }
);

// Get API key
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

// Check if API key is provided
if (!SUPADATA_API_KEY && process.env.CLOUD_SERVICE !== 'true') {
  console.error('Error: SUPADATA_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Supadata client

// Configuration for retries and monitoring
const CONFIG = {
  retry: {
    maxAttempts: Number(process.env.SUPADATA_RETRY_MAX_ATTEMPTS) || 3,
    initialDelay: Number(process.env.SUPADATA_RETRY_INITIAL_DELAY) || 1000,
    maxDelay: Number(process.env.SUPADATA_RETRY_MAX_DELAY) || 10000,
    backoffFactor: Number(process.env.SUPADATA_RETRY_BACKOFF_FACTOR) || 2,
  },
  credit: {
    warningThreshold:
      Number(process.env.SUPADATA_CREDIT_WARNING_THRESHOLD) || 1000,
    criticalThreshold:
      Number(process.env.SUPADATA_CREDIT_CRITICAL_THRESHOLD) || 100,
  },
};

// Add utility function for delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let isStdioTransport = false;

function safeLog(
  level:
    | 'error'
    | 'debug'
    | 'info'
    | 'notice'
    | 'warning'
    | 'critical'
    | 'alert'
    | 'emergency',
  data: any
): void {
  if (isStdioTransport) {
    // For stdio transport, log to stderr to avoid protocol interference
    console.error(
      `[${level}] ${typeof data === 'object' ? JSON.stringify(data) : data}`
    );
  } else {
    // For other transport types, use the normal logging mechanism
    server.sendLoggingMessage({ level, data });
  }
}

// Add retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  attempt = 1
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const isRateLimit =
      error instanceof Error &&
      (error.message.includes('rate limit') || error.message.includes('429'));

    if (isRateLimit && attempt < CONFIG.retry.maxAttempts) {
      const delayMs = Math.min(
        CONFIG.retry.initialDelay *
          Math.pow(CONFIG.retry.backoffFactor, attempt - 1),
        CONFIG.retry.maxDelay
      );

      safeLog(
        'warning',
        `Rate limit hit for ${context}. Attempt ${attempt}/${CONFIG.retry.maxAttempts}. Retrying in ${delayMs}ms`
      );

      await delay(delayMs);
      return withRetry(operation, context, attempt + 1);
    }

    throw error;
  }
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SCRAPE_TOOL, MAP_TOOL, CRAWL_TOOL, CHECK_CRAWL_STATUS_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  try {
    const { name, arguments: args } = request.params;

    const apiKey = process.env.CLOUD_SERVICE
      ? (request.params._meta?.apiKey as string)
      : SUPADATA_API_KEY;
    if (process.env.CLOUD_SERVICE && !apiKey) {
      throw new Error('No API key provided');
    }

    const client = new Supadata({
      apiKey: apiKey as string,
    });
    // Log incoming request with timestamp
    safeLog(
      'info',
      `[${new Date().toISOString()}] Received request for tool: ${name}`
    );

    if (!args) {
      throw new Error('No arguments provided');
    }

    switch (name) {
      case 'supadata_scrape': {
        if (!isScrapeOptions(args)) {
          throw new Error('Invalid arguments for supadata_scrape');
        }
        const { url, ...options } = args;
        try {
          const scrapeStartTime = Date.now();
          safeLog(
            'info',
            `Starting scrape for URL: ${url} with options: ${JSON.stringify(options)}`
          );

          const response = await client.web.scrape(url);

          // Log performance metrics
          safeLog(
            'info',
            `Scrape completed in ${Date.now() - scrapeStartTime}ms`
          );

          // Supadata returns scraped content directly
          // Handle the response format (assuming it returns text content)

          return {
            content: [
              {
                type: 'text',
                text: trimResponseText(
                  typeof response === 'string'
                    ? response
                    : JSON.stringify(response, null, 2)
                ),
              },
            ],
            isError: false,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: 'text', text: trimResponseText(errorMessage) }],
            isError: true,
          };
        }
      }

      case 'supadata_map': {
        if (!isMapOptions(args)) {
          throw new Error('Invalid arguments for supadata_map');
        }
        const { url } = args;
        const response = await client.web.map(url);
        // Supadata map returns URLs, handle the response format
        const urls = Array.isArray(response) ? response : [response];
        return {
          content: [{ type: 'text', text: trimResponseText(urls.join('\n')) }],
          isError: false,
        };
      }

      case 'supadata_crawl': {
        if (!isCrawlOptions(args)) {
          throw new Error('Invalid arguments for supadata_crawl');
        }
        const { url, ...options } = args;
        const response = await withRetry(
          async () =>
            client.web.crawl({
              url,
              limit: options.limit || 10,
            }),
          'crawl operation'
        );

        // Supadata crawl returns a job ID
        const jobId =
          (response as any).jobId || (response as any).id || response;

        return {
          content: [
            {
              type: 'text',
              text: trimResponseText(
                `Started crawl for ${url} with job ID: ${jobId}. Use supadata_check_crawl_status to check progress.`
              ),
            },
          ],
          isError: false,
        };
      }

      case 'supadata_check_crawl_status': {
        if (!isStatusCheckOptions(args)) {
          throw new Error('Invalid arguments for supadata_check_crawl_status');
        }
        const response = await client.web.getCrawlResults(args.id);
        // Handle Supadata crawl results format
        return {
          content: [
            {
              type: 'text',
              text: trimResponseText(JSON.stringify(response, null, 2)),
            },
          ],
          isError: false,
        };
      }

      default:
        return {
          content: [
            { type: 'text', text: trimResponseText(`Unknown tool: ${name}`) },
          ],
          isError: true,
        };
    }
  } catch (error) {
    // Log detailed error information
    safeLog('error', {
      message: `Request failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      tool: request.params.name,
      arguments: request.params.arguments,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    });
    return {
      content: [
        {
          type: 'text',
          text: trimResponseText(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          ),
        },
      ],
      isError: true,
    };
  } finally {
    // Log request completion with performance metrics
    safeLog('info', `Request completed in ${Date.now() - startTime}ms`);
  }
});

// Utility function to trim trailing whitespace from text responses
// This prevents Claude API errors with "final assistant content cannot end with trailing whitespace"
function trimResponseText(text: string): string {
  return text.trim();
}

// Server startup
async function runServer() {
  try {
    console.error('Initializing Supadata MCP Server...');

    const transport = new StdioServerTransport();

    // Detect if we're using stdio transport
    isStdioTransport = transport instanceof StdioServerTransport;
    if (isStdioTransport) {
      console.error(
        'Running in stdio mode, logging will be directed to stderr'
      );
    }

    await server.connect(transport);

    // Now that we're connected, we can send logging messages
    safeLog('info', 'Supadata MCP Server initialized successfully');
    console.error('Supadata MCP Server running on stdio');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

runServer().catch((error: any) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
