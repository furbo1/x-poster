import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Verify environment variables
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || 
        !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
      throw new Error("Twitter credentials not found in environment variables");
    }

    log(`Initializing Twitter client with API key: ${process.env.TWITTER_API_KEY.substring(0, 5)}...`, 'twitter');

    // Create client with OAuth 1.0a user context
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // Get the client with read-write access
    return client.readWrite;
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error occurred";
    log(`Failed to initialize Twitter client: ${errorMessage}`, 'twitter');
    throw new Error(`Twitter client initialization failed: ${errorMessage}`);
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet with text length: ${text.length}`, 'twitter');

    // Try to verify credentials first
    try {
      const user = await client.v1.verifyCredentials();
      log(`Successfully verified Twitter credentials for user: ${user.screen_name}`, 'twitter');
    } catch (verifyError: any) {
      log(`Failed to verify credentials: ${verifyError.message}`, 'twitter');
      if (verifyError.data) {
        log(`Verification Error Details: ${JSON.stringify(verifyError.data, null, 2)}`, 'twitter');
      }
      throw verifyError;
    }

    // Post tweet using v1.1 API for better compatibility
    const tweet = await client.v1.tweet(text);

    if (!tweet?.id_str) {
      throw new Error("Failed to get tweet ID from response");
    }

    log(`Successfully posted tweet with ID: ${tweet.id_str}`, 'twitter');
  } catch (error: any) {
    log(`Failed to post tweet: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Twitter API Error Details: ${JSON.stringify(error.data, null, 2)}`, 'twitter');
    }

    // Format error message based on Twitter API response
    let errorMessage = error.message;
    if (error.data?.errors?.length > 0) {
      const apiError = error.data.errors[0];
      errorMessage = `Twitter API Error ${apiError.code}: ${apiError.message}`;
    }

    throw new Error(errorMessage);
  }
}