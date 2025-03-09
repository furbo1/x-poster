import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function validateAndTrimCredential(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is missing or empty`);
  }
  const trimmed = value.trim();
  log(`${name} length: ${trimmed.length} chars`, 'twitter');
  return trimmed;
}

function getTwitterClient() {
  try {
    const apiKey = validateAndTrimCredential(process.env.TWITTER_API_KEY, 'API Key');
    const apiSecret = validateAndTrimCredential(process.env.TWITTER_API_SECRET, 'API Secret');
    const accessToken = validateAndTrimCredential(process.env.TWITTER_ACCESS_TOKEN, 'Access Token');
    const accessSecret = validateAndTrimCredential(process.env.TWITTER_ACCESS_SECRET, 'Access Secret');

    // Log detailed credential info (safely)
    log('Initializing Twitter client with credentials:', 'twitter');
    log(`API Key (first 4 chars): ${apiKey.substring(0, 4)}...`, 'twitter');
    log(`API Secret (first 4 chars): ${apiSecret.substring(0, 4)}...`, 'twitter');
    log(`Access Token (first 4 chars): ${accessToken.substring(0, 4)}...`, 'twitter');
    log(`Access Secret (first 4 chars): ${accessSecret.substring(0, 4)}...`, 'twitter');

    // Create client with explicit API version selection
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    }, { 
      version: '2', // Explicitly use v2
      debug: true // Enable debug mode for more detailed logs
    });

    return client;
  } catch (error: any) {
    log(`Twitter client initialization error: ${error.message}`, 'twitter');
    throw error;
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet (length: ${text.length}): "${text.substring(0, 20)}..."`, 'twitter');

    // Use v2 endpoint for tweeting
    const tweet = await client.v2.tweet(text);
    log(`Successfully posted tweet with ID: ${tweet.data.id}`, 'twitter');
  } catch (error: any) {
    log(`Failed to post tweet: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Error details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    throw error;
  }
}

export async function verifyTwitterCredentials(): Promise<boolean> {
  try {
    const client = getTwitterClient();
    log('Verifying Twitter credentials...', 'twitter');

    // Use v2 endpoint for verification
    const user = await client.v2.me();
    log(`Verified credentials for user ID: ${user.data.id}`, 'twitter');
    return true;
  } catch (error: any) {
    log(`Credential verification failed: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Error details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    return false;
  }
}
