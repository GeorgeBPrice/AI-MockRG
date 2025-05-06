import OpenAI from "openai";

interface GenerateMockDataParams {
  schema: string;
  schemaType: "sql" | "nosql";
  count: number;
  format: string;
  examples?: string;
  additionalInstructions?: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  useUserSettings?: boolean;
}

export async function generateMockData({
  schema,
  schemaType,
  count,
  format,
  examples,
  additionalInstructions,
  apiKey,
  model,
  baseUrl,
  temperature = 0.5,
  maxTokens = 4000,
  headers = {},
}: GenerateMockDataParams): Promise<string> {

  // Prepare the system message based on schema type
  const systemMessage =
    schemaType === "sql"
      ? `You are a helpful assistant that generates realistic mock data based on SQL schema definitions. Generate data that looks real and contextually appropriate.`
      : `You are a helpful assistant that generates realistic mock data based on NoSQL schema definitions. Generate data that looks real and contextually appropriate.`;

  // Prepare the user message with the schema and requirements
  let userMessage = `Generate ${count} mock records based on the following ${schemaType.toUpperCase()} schema:\n\n${schema}\n\n`;

  // Add format instructions
  userMessage += `Please provide the output in ${format.toUpperCase()} format.\n`;

  // Add examples if provided
  if (examples && examples.trim()) {
    userMessage += `Here are some examples of the style and format I want:\n\n${examples}\n\n`;
    userMessage += `Please generate data that follows the pattern and structure of these examples as closely as possible.\n\n`;
  }

  // Add additional instructions if provided
  if (additionalInstructions && additionalInstructions.trim()) {
    userMessage += `Please follow these additional instructions when generating the data:\n${additionalInstructions}\n\n`;
  }

  // Add specific instructions based on the output format
  if (format.toLowerCase() === "json") {
    userMessage += "Return a valid JSON array containing the records.";
  } else if (format.toLowerCase() === "sql") {
    userMessage += "Return SQL INSERT statement for the SQL format records.";
  } else if (format.toLowerCase() === "csv") {
    userMessage += "Return a CSV format with headers on the first line.";
  } else if (format.toLowerCase() === "xml") {
    userMessage += "Return data in XML format with appropriate tags.";
  } else if (format.toLowerCase() === "xlsx" || format.toLowerCase() === "excel") {
    userMessage += "Return data in CSV format that can be imported into Excel.";
  } else if (format.toLowerCase() === "txt") {
    userMessage += "Return data in plain text format with tab or space separation.";
  } else if (format.toLowerCase() === "html") {
    userMessage += "Return data as an HTML table that can be displayed in a browser.";
  } else {
    userMessage += `Return the data in ${format} format as requested.`;
  }

  try {
    // Detect if we're using an OpenAI-compatible API or another provider
    if (isOpenAiCompatibleEndpoint(baseUrl, model)) {
      return await callOpenAiCompatibleAPI(
        apiKey,
        model,
        systemMessage,
        userMessage,
        temperature,
        maxTokens,
        baseUrl,
        headers
      );
    } else {
      // Use generic API for other models
      return await callGenericAiAPI(
        apiKey,
        model,
        systemMessage,
        userMessage,
        temperature,
        maxTokens,
        baseUrl,
        headers
      );
    }
  } catch (error) {
    console.error("Error calling AI API:", error);
    throw new Error(`AI API request failed: ${(error as Error).message}`);
  }
}

// Function to determine if the endpoint is OpenAI-compatible
function isOpenAiCompatibleEndpoint(baseUrl?: string, model?: string): boolean {
  if (!baseUrl) return true; // Default OpenAI
  
  // Known OpenAI-compatible APIs
  const openAiCompatibleApis = [
    'api.openai.com',
    'api.groq.com',
    'api.together.xyz',
    'api.perplexity.ai'
  ];
  
  // Check if Anthropic API
  if (baseUrl.includes('api.anthropic.com')) {
    return false;
  }
  
  // Check if Cohere API
  if (baseUrl.includes('api.cohere.ai')) {
    return false;
  }
  
  // Check if Azure OpenAI API
  if (baseUrl.includes('openai.azure.com')) {
    return true; // Azure uses OpenAI client but with different auth
  }
  
  // Check if the URL contains any known OpenAI-compatible API patterns
  for (const apiPattern of openAiCompatibleApis) {
    if (baseUrl.includes(apiPattern)) {
      return true;
    }
  }
  
  // Check if model is an OpenAI model
  if (model && (
    model.startsWith('gpt-') || 
    model.startsWith('text-davinci-') ||
    model.startsWith('llama-') ||
    model.startsWith('mixtral-')
  )) {
    return true;
  }
  
  // Check if model is Anthropic
  if (model && model.toLowerCase().includes('claude')) {
    return false;
  }
  
  // Check if model is Cohere
  if (model && (model.startsWith('command-') || model.includes('cohere'))) {
    return false;
  }
  
  return false;
}

// Function to call OpenAI and compatible APIs
async function callOpenAiCompatibleAPI(
  apiKey: string,
  model: string,
  systemMessage: string,
  userMessage: string,
  temperature: number,
  maxTokens: number,
  baseUrl?: string,
  headers?: Record<string, string>
): Promise<string> {
  // Initialize OpenAI client with the provided API key and optional base URL
  const clientOptions: Record<string, unknown> = {
    apiKey,
    defaultHeaders: headers,
  };
  
  // Special handling for Azure OpenAI
  if (baseUrl && baseUrl.includes('openai.azure.com')) {
    // Extract deployment name from the model or use model as is
    const deploymentName = model.includes(':') ? model.split(':')[1] : model;
    
    clientOptions.apiKey = apiKey;
    clientOptions.baseURL = baseUrl;
    clientOptions.defaultQuery = { 'api-version': '2023-05-15' };
    
    // For Azure, we use the model name as the deployment name
    model = deploymentName;
  } else if (baseUrl) {
    clientOptions.baseURL = baseUrl;
  }
  
  const openai = new OpenAI(clientOptions);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    temperature,
    max_tokens: maxTokens,
    });

    // Extract and return the generated content
    return response.choices[0]?.message?.content || "";
}

// Generic function for calling other AI APIs that aren't OpenAI-compatible
async function callGenericAiAPI(
  apiKey: string,
  model: string,
  systemMessage: string,
  userMessage: string,
  temperature: number,
  maxTokens: number,
  baseUrl?: string,
  headers?: Record<string, string>
): Promise<string> {
  let url = baseUrl;
  let requestBody: Record<string, unknown> = {};
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };
  
  // Check for specific providers based on model name and URL
  if (model.toLowerCase().includes('claude')) {
    // Anthropic Claude-specific implementation
    url = baseUrl || 'https://api.anthropic.com/v1/messages';
    requestBody = {
      model,
      system: systemMessage,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: maxTokens,
      temperature,
    };
    
    // Make sure Anthropic API version is set
    if (!headers?.['anthropic-version'] && !headers?.['Anthropic-Version']) {
      requestHeaders['anthropic-version'] = '2023-06-01';
    }
    
    // Anthropic uses x-api-key instead of Bearer token
    delete requestHeaders['Authorization'];
    requestHeaders['x-api-key'] = apiKey;
  } else if (model.toLowerCase().includes('gemini')) {
    // Google Gemini implementation
    const apiVersion = 'v1';
    url = baseUrl || `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
    
    // Add API key as query parameter for Google
    url = `${url}?key=${apiKey}`;
    
    // Remove Authorization header for Google (using key in URL)
    delete requestHeaders['Authorization'];
    
    requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemMessage}\n\n${userMessage}` }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    };
  } else if (model.startsWith('command-') || model.includes('cohere') || (baseUrl && baseUrl.includes('cohere.ai'))) {
    // Cohere implementation
    url = baseUrl || 'https://api.cohere.ai/v1/generate';
    
    requestBody = {
      model,
      prompt: `${systemMessage}\n\n${userMessage}`,
      max_tokens: maxTokens,
      temperature,
    };
    
    // Cohere uses different authorization header
    delete requestHeaders['Authorization'];
    requestHeaders['Authorization'] = `Bearer ${apiKey}`;
  } else if (model.includes('mistral') || (baseUrl && baseUrl.includes('mistral.ai'))) {
    // Mistral AI implementation
    url = baseUrl || 'https://api.mistral.ai/v1/chat/completions';
    
    requestBody = {
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens,
    };
    
    // Mistral uses Bearer token authentication
    requestHeaders['Authorization'] = `Bearer ${apiKey}`;
  } else {
    // Generic implementation as fallback
    url = baseUrl || 'https://api.openai.com/v1/chat/completions';
    requestBody = {
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens,
    };
    
    // Use Bearer token for standard OAuth
    requestHeaders['Authorization'] = `Bearer ${apiKey}`;
  }
  
  // Make the API request
  const response = await fetch(url, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  const data = await response.json();
  
  // Extract content based on the model/provider
  if (model.toLowerCase().includes('claude')) {
    return data.content?.[0]?.text || '';
  } else if (model.toLowerCase().includes('gemini')) {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (model.startsWith('command-') || model.includes('cohere')) {
    return data.generations?.[0]?.text || data.text || '';
  } else if (model.includes('mistral')) {
    return data.choices?.[0]?.message?.content || '';
  } else {
    return data.choices?.[0]?.message?.content || '';
  }
}
