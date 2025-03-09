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

// Create Twitter client with OAuth 1.0a credentials
function getTwitterClient() {
  try {
    const apiKey = process.env.TWITTER_API_KEY?.trim();
    const apiSecret = process.env.TWITTER_API_SECRET?.trim();
    const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
    const accessSecret = process.env.TWITTER_ACCESS_SECRET?.trim();

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error("Missing required Twitter credentials");
    }

    // Log credential info for debugging
    log(`Initializing Twitter client with credentials:`, 'twitter');
    log(`API Key length: ${apiKey.length}`, 'twitter');
    log(`API Secret length: ${apiSecret.length}`, 'twitter');
    log(`Access Token length: ${accessToken.length}`, 'twitter');
    log(`Access Secret length: ${accessSecret.length}`, 'twitter');

    // Create client with OAuth 1.0a credentials
    return new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
  } catch (error: any) {
    log(`Twitter client initialization error: ${error.message}`, 'twitter');
    throw error;
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, 'twitter');

    const tweet = await client.v1.tweet(text);
    log(`Successfully posted tweet with ID: ${tweet.id_str}`, 'twitter');
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

    const user = await client.v1.verifyCredentials();
    log(`Verified credentials for user: ${user.screen_name}`, 'twitter');
    return true;
  } catch (error: any) {
    log(`Credential verification failed: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Error details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    return false;
  }
}