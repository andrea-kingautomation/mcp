import { jest } from '@jest/globals';
import { Supadata } from '@supadata/js';

// Set test timeout
jest.setTimeout(30000);

// Create mock responses
const mockScrapeResponse = '# Test Content';
const mockMapResponse = ['https://example.com/page1', 'https://example.com/page2'];
const mockCrawlResponse = { jobId: 'test-crawl-id' };
const mockCrawlStatusResponse = {
  status: 'completed',
  data: ['# Page 1 Content', '# Page 2 Content']
};

// Create mock web methods
const mockWeb = {
  scrape: jest.fn().mockImplementation(async () => mockScrapeResponse),
  map: jest.fn().mockImplementation(async () => mockMapResponse),
  crawl: jest.fn().mockImplementation(async () => mockCrawlResponse),
  getCrawlResults: jest.fn().mockImplementation(async () => mockCrawlStatusResponse),
};

// Create mock instance
const mockInstance = {
  web: mockWeb,
};

// Mock the module
jest.mock('@supadata/js', () => ({
  __esModule: true,
  Supadata: jest.fn().mockImplementation(() => mockInstance),
}));
