import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    const apiKey = process.env.TWITTER_API_KEY?.trim();
    const apiSecret = process.env.TWITTER_API_SECRET?.trim();
    const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
    const accessSecret = process.env.TWITTER_ACCESS_SECRET?.trim();

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error("Missing required Twitter credentials");
    }

    // Log detailed credential info for debugging
    log(`Initializing Twitter client with credentials:`, 'twitter');
    log(`API Key (first 4 chars): ${apiKey.substring(0, 4)}...`, 'twitter');
    log(`API Secret (first 4 chars): ${apiSecret.substring(0, 4)}...`, 'twitter');
    log(`Access Token (first 4 chars): ${accessToken.substring(0, 4)}...`, 'twitter');
    log(`Access Secret (first 4 chars): ${accessSecret.substring(0, 4)}...`, 'twitter');

    // Create client with explicit API version settings
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    }, { 
      version: '1.1', // Explicitly use v1.1
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

    // Use v1.1 endpoint for tweeting
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

    // Use v1.1 endpoint for verification
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