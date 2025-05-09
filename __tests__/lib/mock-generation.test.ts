import { generateMockData } from '@/lib/openai';

// Mock the OpenAI client
const mockCreateMethod = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateMethod,
        },
      },
    })),
  };
});

describe('Mock Data Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMockData', () => {
    it('should generate mock data for SQL schema', async () => {
      // Sample SQL schema
      const schema = 'CREATE TABLE users (id INT, name TEXT, email TEXT)';
      
      // Mock the OpenAI API response
      const mockData = JSON.stringify([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ]);
      
      mockCreateMethod.mockResolvedValue({
        choices: [
          {
            message: { content: mockData },
            index: 0,
            finish_reason: 'stop',
          },
        ],
      });

      const result = await generateMockData({
        schema,
        schemaType: 'sql',
        count: 2,
        format: 'json',
        apiKey: 'test-api-key',
        model: 'gpt-3.5-turbo',
      });

      // Verify OpenAI usage
      expect(mockCreateMethod).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('SQL schema definitions'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Generate 2 mock records'),
          }),
        ]),
      }));

      // Verify the result
      expect(result).toBe(mockData);
    });

    it('should generate mock data for NoSQL schema', async () => {
      const schema = `
        {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "age": { "type": "number" }
          }
        }
      `;
      
      // Mock the OpenAI API response
      const mockData = JSON.stringify([
        { name: 'John Doe', age: 30 },
        { name: 'Jane Smith', age: 25 },
      ]);
      
      mockCreateMethod.mockResolvedValue({
        choices: [
          {
            message: { content: mockData },
            index: 0,
            finish_reason: 'stop',
          },
        ],
      });

      const result = await generateMockData({
        schema,
        schemaType: 'nosql',
        count: 2,
        format: 'json',
        apiKey: 'test-api-key',
        model: 'gpt-4',
        temperature: 0.7,
      });

      // Verify the API was called with correct parameters
      expect(mockCreateMethod).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4',
        temperature: 0.7,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('NoSQL schema definitions'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Generate 2 mock records'),
          }),
        ]),
      }));

      expect(result).toBe(mockData);
    });

    it('should include examples and additional instructions if provided', async () => {
      const schema = 'CREATE TABLE products (id INT, name TEXT, price DECIMAL)';
      const examples = 'Example: {"id": 1, "name": "Product 1", "price": 19.99}';
      const additionalInstructions = 'Make sure all prices are between $10 and $100';
      
      const mockData = JSON.stringify([
        { id: 1, name: 'Premium Widget', price: 59.99 },
        { id: 2, name: 'Deluxe Gadget', price: 89.99 },
      ]);
      
      mockCreateMethod.mockResolvedValue({
        choices: [
          {
            message: { content: mockData },
            index: 0,
            finish_reason: 'stop',
          },
        ],
      });

      const result = await generateMockData({
        schema,
        schemaType: 'sql',
        count: 2,
        format: 'json',
        examples,
        additionalInstructions,
        apiKey: 'test-api-key',
        model: 'gpt-3.5-turbo',
      });

      // Verify the API request included examples and additional instructions
      expect(mockCreateMethod).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(examples),
          }),
        ]),
      }));
      
      expect(mockCreateMethod).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(additionalInstructions),
          }),
        ]),
      }));

      expect(result).toBe(mockData);
    });

    it('should support different output formats', async () => {
      const schema = 'CREATE TABLE users (id INT, name TEXT)';
      
      // Mock the OpenAI API response for CSV format
      const mockData = 'id,name\n1,John Doe\n2,Jane Smith';
      
      mockCreateMethod.mockResolvedValue({
        choices: [
          {
            message: { content: mockData },
            index: 0,
            finish_reason: 'stop',
          },
        ],
      });

      const result = await generateMockData({
        schema,
        schemaType: 'sql',
        count: 2,
        format: 'csv',
        apiKey: 'test-api-key',
        model: 'gpt-3.5-turbo',
      });

      // Verify the API request included CSV format instructions
      expect(mockCreateMethod).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('CSV format'),
          }),
        ]),
      }));

      expect(result).toBe(mockData);
    });

    it('should handle API errors gracefully', async () => {
      const schema = 'CREATE TABLE users (id INT, name TEXT)';
      
      // Mock the OpenAI API to throw an error
      const errorMessage = 'API request failed';
      mockCreateMethod.mockRejectedValue(new Error(errorMessage));

      // Call the function and expect it to throw an error
      await expect(generateMockData({
        schema,
        schemaType: 'sql',
        count: 2,
        format: 'json',
        apiKey: 'test-api-key',
        model: 'gpt-3.5-turbo',
      })).rejects.toThrow('AI API request failed');
    });
  });
}); 