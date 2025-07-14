import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from '@jest/globals';

// Mock Supadata
jest.mock('@supadata/js');

// Test interfaces
interface RequestParams {
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

// Mock client interface using Jest mock functions
interface MockTranscriptService extends jest.MockedFunction<(options: any) => Promise<any>> {
  getJobStatus: jest.MockedFunction<(id: string) => Promise<any>>;
}

interface MockWebService {
  scrape: jest.MockedFunction<(url: string, options?: any) => Promise<string>>;
  map: jest.MockedFunction<(url: string, options?: any) => Promise<string[]>>;
  crawl: jest.MockedFunction<(options: any) => Promise<{ jobId: string }>>;
  getCrawlResults: jest.MockedFunction<(id: string) => Promise<any>>;
}

interface MockSupadataClient {
  transcript: MockTranscriptService;
  web: MockWebService;
}

describe('Supadata Tool Tests', () => {
  let mockClient: MockSupadataClient;
  let requestHandler: (request: RequestParams) => Promise<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock client with Jest mock functions
    const mockTranscriptFn = jest.fn() as any;
    mockTranscriptFn.getJobStatus = jest.fn();
    
    mockClient = {
      transcript: mockTranscriptFn,
      web: {
        scrape: jest.fn(),
        map: jest.fn(),
        crawl: jest.fn(),
        getCrawlResults: jest.fn(),
      }
    };

    // Create request handler
    requestHandler = async (request: RequestParams) => {
      const { name, arguments: args } = request.params;
      if (!args) {
        throw new Error('No arguments provided');
      }
      return handleRequest(name, args, mockClient);
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test transcript functionality
  test('should handle transcript request', async () => {
    const url = 'https://youtube.com/watch?v=example';
    const options = { lang: 'en', text: false };

    const mockResponse = 'Transcript content here';

    mockClient.transcript.mockResolvedValueOnce(mockResponse);

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_transcript',
        arguments: { url, ...options },
      },
    });

    expect(response).toEqual({
      content: [{ type: 'text', text: 'Transcript content here' }],
      isError: false,
    });
    expect(mockClient.transcript).toHaveBeenCalledWith({ url, lang: 'en', text: false });
  });

  // Test transcript with job ID response
  test('should handle transcript request with job ID', async () => {
    const url = 'https://youtube.com/watch?v=example';
    const mockResponse = { jobId: 'test-transcript-job-id' };

    mockClient.transcript.mockResolvedValueOnce(mockResponse);

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_transcript',
        arguments: { url },
      },
    });

    expect(response.isError).toBe(false);
    expect(response.content[0].text).toContain('test-transcript-job-id');
    expect(mockClient.transcript).toHaveBeenCalledWith({ url });
  });

  // Test check transcript status functionality
  test('should handle transcript status request', async () => {
    const id = 'test-transcript-id';

    const mockStatusResponse = {
      status: 'completed',
      result: 'Full transcript content here'
    };

    mockClient.transcript.getJobStatus.mockResolvedValueOnce(mockStatusResponse);

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_check_transcript_status',
        arguments: { id },
      },
    });

    expect(response.isError).toBe(false);
    expect(response.content[0].text).toContain('completed');
    expect(mockClient.transcript.getJobStatus).toHaveBeenCalledWith(id);
  });

  // Test scrape functionality
  test('should handle scrape request', async () => {
    const url = 'https://example.com';
    const options = { formats: ['markdown'] };

    const mockResponse = '# Test Content';

    mockClient.web.scrape.mockResolvedValueOnce(mockResponse);

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_scrape',
        arguments: { url, ...options },
      },
    });

    expect(response).toEqual({
      content: [{ type: 'text', text: '# Test Content' }],
      isError: false,
    });
    expect(mockClient.web.scrape).toHaveBeenCalledWith(url);
  });


  // Test map functionality  
  test('should handle map request', async () => {
    const url = 'https://example.com';

    const mockMapResponse = ['https://example.com/page1', 'https://example.com/page2'];

    mockClient.web.map.mockResolvedValueOnce(mockMapResponse);

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_map',
        arguments: { url },
      },
    });

    expect(response.isError).toBe(false);
    expect(response.content[0].text).toContain('https://example.com/page1');
    expect(mockClient.web.map).toHaveBeenCalledWith(url);
  });

  // Test check crawl status functionality
  test('should handle crawl status request', async () => {
    const id = 'test-crawl-id';

    const mockStatusResponse = {
      status: 'completed',
      data: ['# Page 1 Content', '# Page 2 Content']
    };

    mockClient.web.getCrawlResults.mockResolvedValueOnce(mockStatusResponse);

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_check_crawl_status',
        arguments: { id },
      },
    });

    expect(response.isError).toBe(false);
    expect(response.content[0].text).toContain('completed');
    expect(mockClient.web.getCrawlResults).toHaveBeenCalledWith(id);
  });

  // Test crawl functionality
  test('should handle crawl request', async () => {
    const url = 'https://example.com';
    const options = { maxDepth: 2 };

    mockClient.web.crawl.mockResolvedValueOnce({
      jobId: 'test-crawl-id',
    });

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_crawl',
        arguments: { url, ...options },
      },
    });

    expect(response.isError).toBe(false);
    expect(response.content[0].text).toContain('test-crawl-id');
    expect(mockClient.web.crawl).toHaveBeenCalledWith({
      url,
      limit: 10,
    });
  });

  // Test error handling
  test('should handle API errors', async () => {
    const url = 'https://example.com';

    mockClient.web.scrape.mockRejectedValueOnce(new Error('API Error'));

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_scrape',
        arguments: { url },
      },
    });

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('API Error');
  });

  // Test rate limiting
  test('should handle rate limits', async () => {
    const url = 'https://example.com';

    // Mock rate limit error
    mockClient.web.scrape.mockRejectedValueOnce(
      new Error('rate limit exceeded')
    );

    const response = await requestHandler({
      method: 'call_tool',
      params: {
        name: 'supadata_scrape',
        arguments: { url },
      },
    });

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('rate limit exceeded');
  });
});

// Helper function to simulate request handling
async function handleRequest(
  name: string,
  args: any,
  client: MockSupadataClient
) {
  try {
    switch (name) {
      case 'supadata_transcript': {
        const options: any = { url: args.url };
        if (args.lang) options.lang = args.lang;
        if (args.text !== undefined) options.text = args.text;
        if (args.chunkSize) options.chunkSize = args.chunkSize;
        if (args.mode) options.mode = args.mode;
        
        const response = await client.transcript(options);
        
        // Check if response contains a job ID (async processing)
        if (typeof response === 'object' && response !== null && 'jobId' in response) {
          const jobId = (response as any).jobId;
          return {
            content: [
              {
                type: 'text',
                text: `Started transcript job for ${args.url} with job ID: ${jobId}. Use supadata_check_transcript_status to check progress.`,
              },
            ],
            isError: false,
          };
        }
        
        return {
          content: [
            { type: 'text', text: typeof response === 'string' ? response : JSON.stringify(response) },
          ],
          isError: false,
        };
      }
      
      case 'supadata_check_transcript_status': {
        const response = await client.transcript.getJobStatus(args.id);
        return {
          content: [
            { type: 'text', text: JSON.stringify(response, null, 2) },
          ],
          isError: false,
        };
      }

      case 'supadata_scrape': {
        const response = await client.web.scrape(args.url);
        return {
          content: [
            { type: 'text', text: typeof response === 'string' ? response : JSON.stringify(response) },
          ],
          isError: false,
        };
      }

      case 'supadata_map': {
        const response = await client.web.map(args.url);
        const urls = Array.isArray(response) ? response : [response];
        return {
          content: [
            { type: 'text', text: urls.join('\n') },
          ],
          isError: false,
        };
      }

      case 'supadata_crawl': {
        const response = await client.web.crawl({
          url: args.url,
          limit: args.limit || 10,
        });
        const jobId = response.jobId || response;
        return {
          content: [
            {
              type: 'text',
              text: `Started crawl for ${args.url} with job ID: ${jobId}. Use supadata_check_crawl_status to check progress.`,
            },
          ],
          isError: false,
        };
      }

      case 'supadata_check_crawl_status': {
        const response = await client.web.getCrawlResults(args.id);
        return {
          content: [
            { type: 'text', text: JSON.stringify(response, null, 2) },
          ],
          isError: false,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: error instanceof Error ? error.message : String(error),
        },
      ],
      isError: true,
    };
  }
}
