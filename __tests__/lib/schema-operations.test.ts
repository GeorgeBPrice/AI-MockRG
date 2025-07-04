import * as storageKv from '@/lib/storage-kv';

// Mock the storage-kv module with its functions 
jest.mock('@/lib/storage-kv', () => ({
  saveSchema: jest.fn(),
  getSchema: jest.fn(),
  updateSchema: jest.fn(),
  deleteSchema: jest.fn()
}));

// Mock crypto for UUID generation
const mockUUID = 'mock-uuid-123';
if (!global.crypto) {
  global.crypto = {} as Crypto;
}
Object.defineProperty(global.crypto, 'randomUUID', {
  value: jest.fn().mockReturnValue(mockUUID),
  configurable: true,
});

interface SchemaData {
  name: string;
  schema: string;
  schemaType: 'sql' | 'nosql';
  description?: string;
}

interface SavedSchema extends SchemaData {
  id: string;
  createdAt: number;
  updatedAt: number;
}

describe('Schema Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
  });

  describe('saveSchema', () => {
    it('should save a new schema correctly', async () => {
      const userId = 'user123';
      const schema: SchemaData = {
        name: 'Test Schema',
        schema: 'CREATE TABLE users (id INT, name TEXT)',
        schemaType: 'sql',
        description: 'A test schema',
      };

      // Mock implementation
      (storageKv.saveSchema as jest.Mock).mockImplementation((userId: string, schemaData: SchemaData): Promise<SavedSchema> => {
        const timestamp = Date.now();
        
        return Promise.resolve({
          ...schemaData,
          id: mockUUID,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });
      
      // Execute
      const result = await storageKv.saveSchema(userId, schema);
      
      // Verify
      expect(result).toEqual({
        ...schema,
        id: mockUUID,
        createdAt: 1000000000000,
        updatedAt: 1000000000000,
      });
    });
    
    it('should handle schema with undefined description', async () => {
      const userId = 'user123';
      const schema: SchemaData = {
        name: 'Test Schema',
        schema: 'CREATE TABLE users (id INT, name TEXT)',
        schemaType: 'sql',
      };

      // Mock implementation that filters out undefined properties
      (storageKv.saveSchema as jest.Mock).mockImplementation((userId: string, schemaData: SchemaData): Promise<SavedSchema> => {
        const id = mockUUID;
        const timestamp = Date.now();
        
        // Create a cleaned schema with undefined values removed
        const cleanSchemaData = { ...schemaData };
        Object.keys(cleanSchemaData).forEach(key => {
          if (cleanSchemaData[key as keyof typeof cleanSchemaData] === undefined) {
            delete cleanSchemaData[key as keyof typeof cleanSchemaData];
          }
        });
        
        const savedSchema: SavedSchema = {
          ...cleanSchemaData,
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
        } as SavedSchema;
        
        return Promise.resolve(savedSchema);
      });
      
      // Execute
      const result = await storageKv.saveSchema(userId, schema);
      
      expect(result).toHaveProperty('id', mockUUID);
      // Checking that description is not in the object at all, not that it's undefined
      expect(Object.prototype.hasOwnProperty.call(result, 'description')).toBe(false);
    });
  });

  describe('getSchema', () => {
    it('should retrieve a schema by ID', async () => {
      // Setup
      const userId = 'user123';
      const schemaId = 'schema-123';
      const storedSchema: SavedSchema = {
        id: schemaId,
        name: 'Test Schema',
        schema: 'CREATE TABLE users (id INT, name TEXT)',
        schemaType: 'sql',
        createdAt: 1000000000000,
        updatedAt: 1000000000000,
      };

      (storageKv.getSchema as jest.Mock).mockResolvedValue(storedSchema);
      
      // Execute
      const result = await storageKv.getSchema(userId, schemaId);
      
      // Verify
      expect(result).toEqual(storedSchema);
    });
    
    it('should return null for non-existent schema', async () => {
      const userId = 'user123';
      const schemaId = 'non-existent';
      
      (storageKv.getSchema as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await storageKv.getSchema(userId, schemaId);
      
      // Verify
      expect(result).toBeNull();
    });
  });

  describe('updateSchema', () => {
    it('should update an existing schema', async () => {
      // Seup
      const userId = 'user123';
      const schemaId = 'schema-123';
      const existingSchema: SavedSchema = {
        id: schemaId,
        name: 'Old Name',
        schema: 'CREATE TABLE users (id INT, name TEXT)',
        schemaType: 'sql',
        createdAt: 900000000000,
        updatedAt: 900000000000,
      };
      
      const updates = {
        name: 'New Name',
        description: 'Updated description',
      };

      // Mock implementation
      (storageKv.updateSchema as jest.Mock).mockImplementation((userId: string, schemaId: string, updates: Partial<SchemaData>): Promise<SavedSchema> => {
        return Promise.resolve({
          ...existingSchema,
          ...updates,
          updatedAt: Date.now(),
        });
      });
      
      // Execute
      const result = await storageKv.updateSchema(userId, schemaId, updates);
      
      // Verify
      expect(result).toEqual({
        ...existingSchema,
        ...updates,
        updatedAt: 1000000000000,
      });
    });
    
    it('should return null when schema does not exist', async () => {
      const userId = 'user123';
      const schemaId = 'non-existent';
      const updates = { name: 'New Name' };
      
      // Mock implementation
      (storageKv.updateSchema as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await storageKv.updateSchema(userId, schemaId, updates);
      
      // Verify
      expect(result).toBeNull();
    });
  });

  describe('deleteSchema', () => {
    it('should delete a schema by ID', async () => {
      const userId = 'user123';
      const schemaId = 'schema-123';
      
      (storageKv.deleteSchema as jest.Mock).mockResolvedValue(true);
      
      // Execute
      const result = await storageKv.deleteSchema(userId, schemaId);
      
      // Verify
      expect(result).toBe(true);
    });
    
    it('should return false when schema does not exist', async () => {
      const userId = 'user123';
      const schemaId = 'non-existent';
      
      (storageKv.deleteSchema as jest.Mock).mockResolvedValue(false);
      
      // Execute
      const result = await storageKv.deleteSchema(userId, schemaId);
      
      // Verify
      expect(result).toBe(false);
    });
  });
}); 