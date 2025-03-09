import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Use same naming as working example for consistency
    const consumer_key = process.env.TWITTER_API_KEY?.trim();
    const consumer_secret = process.env.TWITTER_API_SECRET?.trim();
    const access_token = process.env.TWITTER_ACCESS_TOKEN?.trim();
    const access_token_secret = process.env.TWITTER_ACCESS_SECRET?.trim();

    if (!consumer_key || !consumer_secret || !access_token || !access_token_secret) {
      throw new Error("Missing required Twitter credentials");
    }

    // Log detailed credential info for debugging
    log('Initializing Twitter client with credentials:', 'twitter');
    log(`Consumer key length: ${consumer_key.length}`, 'twitter');
    log(`Consumer secret length: ${consumer_secret.length}`, 'twitter');
    log(`Access token length: ${access_token.length}`, 'twitter');
    log(`Access secret length: ${access_token_secret.length}`, 'twitter');

    // Create client with OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: consumer_key,
      appSecret: consumer_secret,
      accessToken: access_token,
      accessSecret: access_token_secret,
    });

    // Return the v1 client to match Tweepy's approach
    return client.v1;
  } catch (error: any) {
    log(`Twitter client initialization error: ${error.message}`, 'twitter');
    throw error;
  }
}

export async function testAuth() {
  try {
    const client = getTwitterClient();
    log('Running detailed authentication test...', 'twitter');

    // Test basic credentials validation
    const user = await client.verifyCredentials({
      skip_status: true
    });

    return {
      success: true,
      username: user.screen_name,
      userId: user.id_str,
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

    // Post tweet using v1 API
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

    // Use verifyCredentials() which matches Tweepy's behavior
    const user = await client.verifyCredentials();
    log(`Verified credentials for user: ${user.screen_name}`, 'twitter');
    return true;
  } catch (error: any) {
    log(`Credential verification failed: ${error.message}`, 'twitter');
    
    // Log more detailed error information
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