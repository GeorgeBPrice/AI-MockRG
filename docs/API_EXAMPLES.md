# AI Mocker API - Quick Reference

## Quick Start

Replace `YOUR_API_KEY` with your actual API key and `our-server-domain` with your actual domain.

## Basic Examples

### 1. Generate Simple User Data (JSON)

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(255))",
    "count": 5,
    "format": "json"
  }'
```

### 2. Generate Product Data (CSV)

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE products (id INT, name VARCHAR(100), price DECIMAL(10,2), category VARCHAR(50))",
    "count": 10,
    "format": "csv"
  }'
```

### 3. Generate SQL INSERT Statements

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE orders (order_id VARCHAR(20), customer_id INT, total_amount DECIMAL(10,2), order_date DATE)",
    "count": 15,
    "format": "sql"
  }'
```

## Advanced Examples

### 4. Complex Schema with Relationships

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255)); CREATE TABLE orders (id INT PRIMARY KEY, customer_id INT, total_amount DECIMAL(10,2), FOREIGN KEY (customer_id) REFERENCES customers(id))",
    "count": 8,
    "format": "json",
    "additionalInstructions": "Generate realistic customer and order data with proper relationships"
  }'
```

### 5. NoSQL Schema (JSON Schema)

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "{\"type\": \"object\", \"properties\": {\"name\": {\"type\": \"string\"}, \"age\": {\"type\": \"integer\", \"minimum\": 18, \"maximum\": 65}, \"email\": {\"type\": \"string\", \"format\": \"email\"}}}",
    "schemaType": "nosql",
    "count": 12,
    "format": "json"
  }'
```

### 6. Custom Parameters

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE events (id INT, title VARCHAR(200), description TEXT, start_date TIMESTAMP)",
    "count": 20,
    "format": "xml",
    "temperature": 0.8,
    "maxTokens": 6000,
    "additionalInstructions": "Generate diverse event data with realistic titles and descriptions"
  }'
```

## Error Testing

### 7. Test Invalid Schema

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "",
    "count": 150
  }'
```

### 8. Test Missing Authentication

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE test (id INT)",
    "count": 1
  }'
```

## Environment Variables

For production use, store your API key in environment variables:

```bash
# Set environment variable
export AI_MOCKER_API_KEY="your-api-key-here"

# Use in curl
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer $AI_MOCKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE users (id INT, name VARCHAR(100))",
    "count": 5
  }'
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "result": "[{\"id\": 1, \"name\": \"John Doe\", \"email\": \"john.doe@example.com\"}]",
  "usage": {
    "limit": 5,
    "remaining": 4,
    "resetTimestamp": 1704067200
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Daily rate limit exceeded. You have used all 5 of your free generations for today.",
  "usage": {
    "limit": 5,
    "remaining": 0,
    "resetTimestamp": 1704067200
  }
}
```

## Rate Limit Headers

All responses include rate limit information in headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1704067200
```

## Common Schema Patterns

### User Management
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
)
```

### E-commerce
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  price DECIMAL(10,2),
  stock_quantity INT,
  category_id INT,
  created_at TIMESTAMP
)
```

### Blog/Content
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  author_id INT,
  published_at TIMESTAMP,
  status ENUM('draft', 'published', 'archived')
)
```

## Tips

1. **Start Simple**: Begin with basic schemas and gradually add complexity
2. **Use Examples**: Provide example data to guide the AI generation
3. **Monitor Usage**: Check the `usage` field in responses to track your daily limit
4. **Handle Errors**: Always check for error responses and handle rate limiting
5. **Secure Keys**: Never commit API keys to version control

## API Key Management

### Create API Key
```bash
curl -X POST https://our-server-domain/api/user/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production App"
  }'
```

### List API Keys
```bash
curl -X GET https://our-server-domain/api/user/api-keys
```

### Revoke API Key
```bash
curl -X DELETE https://our-server-domain/api/user/api-keys/YOUR_KEY_ID
```

**Note:** API key management endpoints require user authentication via session cookies, not API key authentication. Use these endpoints through the web interface or with proper session authentication. 