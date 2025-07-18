# AI Mocker - Mock Record Generator

A powerful tool for generating realistic mock data using AI LLMs.

## New in v1.1.0: External API

**Programmatic Access with API Keys**

- **External API Endpoint**: `POST /api/v1/generate` for programmatic data generation
- **Secure API Key Management**: Create, manage, and revoke API keys with 90-day expiry
- **Bearer Token Authentication**: Use API keys in Authorization header
- **Clean Data Response**: Get clean JSON/SQL/CSV/etc, without explanatory text
- **Rate Limiting**: 5 free generations per day (paid tiers coming soon).
- **Multiple Formats**: JSON, SQL, CSV, XML, HTML, TXT support

### Simplest Quick Start with External API

```bash
curl -X POST https://the-apps-domain.com/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "users (id INT, name VARCHAR(100), email VARCHAR(255))",
    "count": 5,
    "format": "sql"
  }'
```

📖 [Full API Documentation](docs/EXTERNAL_API.md) | 📦 [Postman Collection](docs/AI_Mocker_API.postman_collection.json)

## AI Bring-your-own API Key Security Enhancement

**API Keys Stored in Browser's localStorage**

- Authenticated user's API keys are stored in your browser's localStorage instead of our database
- Keys are only transmitted to our server during mock data generation requests
- Keys are never permanently stored on our servers, and are processed in memmory only
- Note: clearing your browser, or using the option in settings to delete your data will remove your stored API keys

## Supported AI Providers

The application supports multiple AI providers:

- OpenAI (GPT-4o, GPT-3.5-Turbo, etc)
- Anthropic Claude (Claude-3-7-Sonnet, Claude-3-Haiku, etc)
- Mistral AI models
- Google Gemini models
- Cohere models
- Azure OpenAI

## Configuration Options

Configure your generation parameters:

- Schema Type: SQL, NoSQL, or Sample Data
- Record Count: How many records to generate
- Output Format: JSON, CSV, or other formats
- Temperature: Control randomness of generated data
- Max Tokens: Control response length
- Custom Headers: Add provider-specific headers

## Homepage Screenshot

![image](https://github.com/user-attachments/assets/c1dd5569-4aa5-46a1-a32a-0295adb893f5)

## Environment Variables

After setting up Upstash Redis through Vercel, you'll need to add these environment variables to your `.env.local` file:

### Authentication
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# OAuth Providers
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret
GOOGLE_ID=your-google-id
GOOGLE_SECRET=your-google-secret
```

### OpenAI, for free usage
```
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_DEFAULT_MODEL=gpt-4o-mini
# OPENAI_API_BASE_URL=https://api.openai.com/v1 # Custom API endpoint (optional)
```

### Upstash Redis (from Vercel)
The following variables will be provided by Vercel after connecting an Upstash Redis database to your project:

```
REDIS_UPSTASH_URL_KV_REST_API_URL=your-upstash-rest-api-url
REDIS_UPSTASH_URL_KV_REST_API_TOKEN=your-upstash-rest-api-token
REDIS_UPSTASH_URL_KV_REST_API_READ_ONLY_TOKEN=your-upstash-read-only-token
REDIS_UPSTASH_URL_KV_URL=your-upstash-redis-url
REDIS_UPSTASH_URL_REDIS_URL=your-upstash-redis-url
REDIS_URL=your_redis_service_url
VERCEL_OIDC_TOKEN=token_to_connect_to_redis_service
```

## Features

- Generate mock data from SQL or NoSQL schemas
- Save and manage generator profiles
- Authentication with GitHub, Google, or email
- Real-time record generation request tracking using Redis Streams/Upstash
- Rate limitting of free API record generation requests using Redis
- Export data in JSON, SQL, or CSV formats
- **NEW**: External API with secure API key authentication
- **NEW**: Programmatic data generation for integrations
- **NEW**: API key management with usage tracking

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19
- **Styling**: TailwindCSS + Shadcn UI + Toast
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Storage**: Vercel KV (Upstash Redis) + Edge Config
- **Rate Limitting**: Vercel Redis
- **Deployment**: Vercel (they have a free tier in case you didnt know)
- **AI Integration**: OpenAI API
- **Security**: PBKDF2 hashing with unique salt per API key

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run the development server with `npm run dev`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Setup

This project uses NextAuth.js for authentication. To set up authentication, you need to:

1. Generate a secret key:

```bash
openssl rand -base64 32
```

2. Add this key to your `.env.local` file as `NEXTAUTH_SECRET`.

3. Set up OAuth providers (optional):
   - GitHub: Create an OAuth app in GitHub and add credentials to `.env.local`
   - Google: Set up a Google OAuth application and add credentials to `.env.local`

## Vercel KV Setup

For data storage, this application uses Vercel KV:

1. Install the Vercel CLI:

```bash
npm i -g vercel
```

2. Link your project to Vercel:

```bash
vercel link
```

3. Create a KV database from the Vercel dashboard

4. Add the KV environment variables to your project:

```bash
vercel env pull
```

## Deployment

This application is designed to be deployed on Vercel:

1. Push your code to a GitHub repository

2. Import the repository in the Vercel dashboard

3. Configure the environment variables in the Vercel dashboard

4. Deploy!

## Testing

This project uses Jest and React Testing Library for testing. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Generate HTML coverage report
npm run test:coverage:report
```

After running the coverage report, you can view detailed results by opening `coverage/lcov-report/index.html` in your browser.

### Coverage Thresholds

The project has configured coverage thresholds to maintain code quality. These thresholds can be adjusted in the `jest.config.js` file.

### Testing Critical Components

To focus testing on rate limiting components only:

```bash
npm run test:critical
```

## Releases

### v1.1.0 - External API & API Key Management
- **External API**: New `/api/v1/generate` endpoint for programmatic access
- **API Key Management**: Create, manage, and revoke API keys with 90-day expiry
- **Secure Authentication**: PBKDF2 hashing with unique salt per key
- **Usage Tracking**: Monitor API key usage and last accessed times
- **Clean Data Response**: Extract records without explanatory text
- **Documentation**: Complete API docs and Postman collection
- **Comprehensive Testing**: Full test coverage for API key functionality
- **Web Interface**: Dedicated API Keys management page
- **Rate Limiting**: 5 generations per day (free tier)
- **Debug Tools**: Development endpoints for testing and troubleshooting

### v1.0.0 - Initial Release
- **Core Functionality & Web UI**: Mock data generation for SQL/NoSQL schemas
- **Authentication**: GitHub, Google, and email authentication
- **Data Storage**: Vercel KV integration for user data
- **Rate Limiting**: Daily limits for free tier users
- **Modern UI**: TailwindCSS + Shadcn UI components
- **Real-time Tracking**: Redis Streams for generation monitoring

## License

This project is licensed under the MIT License - see the LICENSE file for details.
