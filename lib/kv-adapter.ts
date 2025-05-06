import { createClient } from '@vercel/kv';

function cleanRestApiUrl(url: string | undefined): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (e) {
    console.error('Error parsing REST API URL:', e);
    return url;
  }
}

const kvClient = createClient({
  url: cleanRestApiUrl(process.env.REDIS_UPSTASH_URL_KV_REST_API_URL) || '',
  token: process.env.REDIS_UPSTASH_URL_KV_REST_API_TOKEN || '',
});

export { kvClient as kv }; 