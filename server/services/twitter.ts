import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Get and validate credentials
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY?.trim() || '',
      apiSecret: process.env.TWITTER_API_SECRET?.trim() || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim() || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim() || '',
    };

    if (!credentials.apiKey || !credentials.apiSecret || !credentials.accessToken || !credentials.accessSecret) {
      throw new Error("Missing required Twitter credentials");
    }

    // Create client with OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    // Return the v2 client since we need v2 endpoints
    return client.v2;
  } catch (error: any) {
    log(`Twitter client initialization error: ${error.message}`, 'twitter');
    throw error;
  }
}

export async function testAuth() {
  try {
    const client = getTwitterClient();
    log('Running detailed authentication test...', 'twitter');

    // Test credentials using v2 endpoint
    const user = await client.me();

    return {
      success: true,
      username: user.data.username,
      userId: user.data.id,
      message: "Authentication successful"
    };
  } catch (error: any) {
    log('Authentication test failed:', 'twitter');
    log(`Error message: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Error data: ${JSON.stringify(error.data)}`, 'twitter');
    }
    throw error;
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, 'twitter');

    // Post tweet using v2 API
    const tweet = await client.tweet(text);
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

    // Use v2.me() which is supported by our access level
    const user = await client.me();
    log(`Verified credentials for user: ${user.data.username}`, 'twitter');
    return true;
  } catch (error: any) {
    log(`Credential verification failed: ${error.message}`, 'twitter');

    if (error.data) {
      log(`Error details: ${JSON.stringify(error.data)}`, 'twitter');
    }

    // Add credential format checks to help diagnose issues
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY?.trim() || '',
      apiSecret: process.env.TWITTER_API_SECRET?.trim() || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim() || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim() || '',
    };

    log('Credential format check:', 'twitter');
    Object.entries(credentials).forEach(([key, value]) => {
      log(`${key}: Length=${value.length}, HasSpaces=${/\s/.test(value)}`, 'twitter');
    });

    return false;
  }
}