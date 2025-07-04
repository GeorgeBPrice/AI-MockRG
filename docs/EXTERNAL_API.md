# AI Mocker External API Documentation

## Overview

The AI Mocker External API allows you to generate mock data programmatically using API keys. This API provides the same functionality as the web interface but is designed for integration with your applications and services.

## Base URL

```
https://our-server-domain/api/v1
```

## Authentication

All API requests require authentication using API keys. API keys are provided in the `Authorization` header using the Bearer token format.

### API Key Format

```
Authorization: Bearer YOUR_API_KEY_HERE
```

### Getting API Keys

1. Log in to your AI Mocker account
2. Navigate to Settings → API Keys
3. Create a new API key with a descriptive name
4. Copy the generated API key (it will only be shown once)
5. Store the API key securely in your application

**⚠️ Important:** API keys are sensitive credentials. Never expose them in client-side code or public repositories.

## Rate Limiting

- **Free Tier:** 5 generations per day
- **Rate Limit Headers:** All responses include rate limit information
- **Rate Limit Reset:** Daily at midnight UTC

### Rate Limit Headers

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1704067200
```

## Endpoints

### Generate Mock Data

**POST** `/api/v1/generate`

Generate mock data based on a schema definition.

#### Request Body

```json
{
  "schema": "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255), created_at TIMESTAMP)",
  "schemaType": "sql",
  "count": 10,
  "format": "json",
  "examples": "Example user data",
  "additionalInstructions": "Make the data realistic with proper email formats",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

#### Parameters

| Parameter                | Type   | Required | Default  | Description                                                           |
| ------------------------ | ------ | -------- | -------- | --------------------------------------------------------------------- |
| `schema`                 | string | ✅       | -        | SQL schema or JSON schema definition                                  |
| `schemaType`             | string | ❌       | `"sql"`  | Schema type: `"sql"` or `"nosql"`                                     |
| `count`                  | number | ❌       | `10`     | Number of records to generate (1-100)                                 |
| `format`                 | string | ❌       | `"json"` | Output format: `"json"`, `"csv"`, `"sql"`, `"xml"`, `"html"`, `"txt"` |
| `examples`               | string | ❌       | -        | Example data to guide generation                                      |
| `additionalInstructions` | string | ❌       | -        | Additional instructions for the AI                                    |
| `temperature`            | number | ❌       | `0.7`    | AI creativity level (0.0-2.0)                                         |
| `maxTokens`              | number | ❌       | `4000`   | Maximum tokens for generation (100-100000)                            |

#### Response Format

**Success Response (200)**

The `result` field contains clean data without explanatory text or markdown formatting:

```json
{
  "success": true,
  "result": "[{\"id\": 1, \"name\": \"John Doe\", \"email\": \"john.doe@example.com\", \"created_at\": \"2024-01-15T10:30:00Z\"}]",
  "usage": {
    "limit": 5,
    "remaining": 4,
    "resetTimestamp": 1704067200
  }
}
```

**Result Format Examples:**

- **JSON format**: Returns a clean JSON array: `[{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]`
- **SQL format**: Returns clean INSERT statements: `INSERT INTO users (id, name) VALUES (1, 'John');`
- **CSV format**: Returns clean CSV data: `id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com`
- **XML format**: Returns clean XML: `<users><user><id>1</id><name>John</name></user></users>`
- **HTML format**: Returns clean HTML table: `<table><tr><td>1</td><td>John</td></tr></table>`
- **TXT format**: Returns clean text data without formatting

**Error Response (400) - Validation Error**

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": {
    "schema": ["Schema is required"],
    "count": ["Number must be less than or equal to 100"]
  },
  "usage": {
    "limit": 5,
    "remaining": 4,
    "resetTimestamp": 1704067200
  }
}
```

**Error Response (401) - Authentication Error**

```json
{
  "success": false,
  "error": "Invalid or missing API key",
  "message": "Please provide a valid API key in the Authorization header"
}
```

**Error Response (429) - Rate Limit Exceeded**

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

**Error Response (500) - Server Error**

```json
{
  "success": false,
  "error": "Failed to generate mock data: AI service unavailable",
  "usage": {
    "limit": 5,
    "remaining": 4,
    "resetTimestamp": 1704067200
  }
}
```

### API Key Management

The following endpoints allow you to manage your API keys through the web interface. These endpoints require user authentication via NextAuth session cookies.

#### Create API Key

**POST** `/api/user/api-keys`

Create a new API key for your account.

**Request Body:**

```json
{
  "name": "Production App"
}
```

**Response:**

```json
{
  "success": true,
  "apiKey": "your-generated-api-key-here",
  "keyId": "uuid-of-the-key",
  "name": "Production App",
  "expiresAt": 1704067200000
}
```

**⚠️ Important:** The `apiKey` field is only returned once upon creation. Store it securely as it cannot be retrieved later.

#### List API Keys

**GET** `/api/user/api-keys`

List all active API keys for your account.

**Response:**

```json
{
  "success": true,
  "keys": [
    {
      "id": "uuid-of-the-key",
      "name": "Production App",
      "createdAt": 1704067200000,
      "expiresAt": 1704067200000,
      "lastUsed": 1704067200000,
      "usageCount": 15
    }
  ]
}
```

#### Revoke API Key

**DELETE** `/api/user/api-keys/{keyId}`

Revoke an API key. This action cannot be undone.

**Response:**

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

## Examples

### cURL Examples

#### Basic SQL Generation

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(100), price DECIMAL(10,2), category VARCHAR(50))",
    "count": 5,
    "format": "json"
  }'
```

#### NoSQL Schema Generation

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "{\"type\": \"object\", \"properties\": {\"name\": {\"type\": \"string\"}, \"age\": {\"type\": \"integer\"}, \"email\": {\"type\": \"string\", \"format\": \"email\"}}}",
    "schemaType": "nosql",
    "count": 10,
    "format": "csv",
    "examples": "Sample user data with realistic names and ages",
    "additionalInstructions": "Generate diverse data with various age ranges and realistic email addresses"
  }'
```

#### Custom Format and Parameters

```bash
curl -X POST https://our-server-domain/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "CREATE TABLE orders (order_id VARCHAR(20), customer_id INT, total_amount DECIMAL(10,2), order_date DATE, status VARCHAR(20))",
    "count": 20,
    "format": "sql",
    "temperature": 0.8,
    "maxTokens": 6000,
    "additionalInstructions": "Generate realistic order data with proper date formats and status values like pending, shipped, delivered"
  }'
```

### JavaScript Examples

#### Using Fetch API

```javascript
const generateMockData = async (apiKey, schema, options = {}) => {
  const response = await fetch("https://our-server-domain/api/v1/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      schema,
      schemaType: options.schemaType || "sql",
      count: options.count || 10,
      format: options.format || "json",
      examples: options.examples,
      additionalInstructions: options.additionalInstructions,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 4000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${data.error}`);
  }

  return data;
};

// Usage
try {
  const result = await generateMockData(
    "YOUR_API_KEY",
    "CREATE TABLE users (id INT, name VARCHAR(100), email VARCHAR(255))",
    {
      count: 5,
      format: "json",
      additionalInstructions: "Generate realistic user data",
    }
  );

  console.log("Generated data:", JSON.parse(result.result));
  console.log("Remaining generations:", result.usage.remaining);
} catch (error) {
  console.error("Generation failed:", error.message);
}
```

#### Using Axios

```javascript
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://our-server-domain/api/v1",
  headers: {
    Authorization: `Bearer ${process.env.AI_MOCKER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

const generateData = async (schema, options = {}) => {
  try {
    const response = await apiClient.post("/generate", {
      schema,
      ...options,
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.data.error}`);
    }
    throw error;
  }
};

// Usage
generateData(
  "CREATE TABLE products (id INT, name VARCHAR(100), price DECIMAL(10,2))",
  { count: 10, format: "csv" }
)
  .then((result) => {
    console.log("Generated CSV:", result.result);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
```

### Python Examples

#### Using requests

```python
import requests
import json

def generate_mock_data(api_key, schema, **options):
    url = "https://our-server-domain/api/v1/generate"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "schema": schema,
        "schemaType": options.get("schemaType", "sql"),
        "count": options.get("count", 10),
        "format": options.get("format", "json"),
        "examples": options.get("examples"),
        "additionalInstructions": options.get("additionalInstructions"),
        "temperature": options.get("temperature", 0.7),
        "maxTokens": options.get("maxTokens", 4000)
    }

    response = requests.post(url, headers=headers, json=payload)
    data = response.json()

    if not response.ok:
        raise Exception(f"API Error: {data.get('error', 'Unknown error')}")

    return data

# Usage
try:
    result = generate_mock_data(
        "YOUR_API_KEY",
        "CREATE TABLE customers (id INT, name VARCHAR(100), email VARCHAR(255), age INT)",
        count=5,
        format="json",
        additionalInstructions="Generate realistic customer data with proper email formats"
    )

    print("Generated data:", json.loads(result["result"]))
    print("Remaining generations:", result["usage"]["remaining"])

except Exception as e:
    print(f"Error: {e}")
```

## Schema Examples

### SQL Schemas

#### Simple Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMP
)
```

#### Complex Table with Constraints

```sql
CREATE TABLE orders (
  order_id VARCHAR(20) PRIMARY KEY,
  customer_id INT NOT NULL,
  total_amount DECIMAL(10,2) CHECK (total_amount > 0),
  order_date DATE,
  status ENUM('pending', 'shipped', 'delivered', 'cancelled'),
  shipping_address TEXT
)
```

#### Multiple Tables

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  description TEXT
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2),
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
)
```

### NoSQL Schemas (JSON Schema)

#### Simple Object

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0, "maximum": 120 },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["name", "age"]
}
```

#### Complex Object

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "user": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "preferences": {
          "type": "object",
          "properties": {
            "theme": { "type": "string", "enum": ["light", "dark"] },
            "notifications": { "type": "boolean" }
          }
        }
      }
    },
    "orders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "orderId": { "type": "string" },
          "amount": { "type": "number", "minimum": 0 }
        }
      }
    }
  }
}
```

## Output Formats

### JSON

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### CSV

```csv
id,name,email,created_at
1,John Doe,john.doe@example.com,2024-01-15T10:30:00Z
2,Jane Smith,jane.smith@example.com,2024-01-15T11:45:00Z
```

### SQL

```sql
INSERT INTO users (id, name, email, created_at) VALUES
(1, 'John Doe', 'john.doe@example.com', '2024-01-15T10:30:00Z'),
(2, 'Jane Smith', 'jane.smith@example.com', '2024-01-15T11:45:00Z');
```

### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user>
    <id>1</id>
    <name>John Doe</name>
    <email>john.doe@example.com</email>
    <created_at>2024-01-15T10:30:00Z</created_at>
  </user>
</users>
```

## Error Handling

### Common Error Codes

| Status Code | Description           | Solution                                                       |
| ----------- | --------------------- | -------------------------------------------------------------- |
| 400         | Bad Request           | Check request body format and required fields                  |
| 401         | Unauthorized          | Verify API key is correct and included in Authorization header |
| 429         | Too Many Requests     | Wait for rate limit reset or upgrade your plan                 |
| 500         | Internal Server Error | Retry the request or contact support                           |

### Best Practices

1. **Always check response status codes**
2. **Handle rate limiting gracefully** - implement exponential backoff
3. **Store API keys securely** - use environment variables
4. **Validate schemas** before sending to the API
5. **Monitor usage** to stay within limits
