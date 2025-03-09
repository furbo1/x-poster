import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function validateCredentialFormat(creds: {
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string
}) {
  // Log credential format details for debugging
  log('Validating credential formats:', 'twitter');
  log(`API Key length: ${creds.apiKey.length}`, 'twitter');
  log(`API Secret length: ${creds.apiSecret.length}`, 'twitter');
  log(`Access Token length: ${creds.accessToken.length}`, 'twitter');
  log(`Access Secret length: ${creds.accessSecret.length}`, 'twitter');

  // Validate API Key format (consumer key)
  if (!/^[A-Za-z0-9]{25}$/.test(creds.apiKey)) {
    throw new Error('Invalid API Key format');
  }

  // Validate API Secret format
  if (!/^[A-Za-z0-9]{50}$/.test(creds.apiSecret)) {
    throw new Error('Invalid API Secret format');
  }

  // Validate Access Token format (should include user ID)
  if (!/^\d+-[A-Za-z0-9]{40}$/.test(creds.accessToken)) {
    throw new Error('Invalid Access Token format');
  }

  // Validate Access Secret format
  if (!/^[A-Za-z0-9]{45}$/.test(creds.accessSecret)) {
    throw new Error('Invalid Access Secret format');
  }
}

function getTwitterClient() {
  try {
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY?.trim() || '',
      apiSecret: process.env.TWITTER_API_SECRET?.trim() || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim() || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim() || ''
    };

    validateCredentialFormat(credentials);

    log('Creating Twitter client...', 'twitter');

    // Create Twitter client with OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    // Get a v1 client instance specifically
    return client.v1;

  } catch (error: any) {
    log(`Twitter client initialization error: ${error.message}`, 'twitter');
    throw error;
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, 'twitter');

    const tweet = await client.tweet(text);
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

    const user = await client.verifyCredentials();
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