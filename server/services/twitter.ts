import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Initialize with OAuth 1.0a credentials for elevated access
    const client = new TwitterApi({
      appKey: "AjQwmmc7fqs8KdMgc8KS0hONy",
      appSecret: "ARso268mRpDRVFZMH5AyDmmo3xirKOQBY8BP8El1OgxP7DbzsJ",
      accessToken: "1460679066672115714-elqvrB3Gi5XkdkhFrvNYx5jfjuuENP",
      accessSecret: "05bENxVnuqRIVrrfOeWfKM9VQMsJzPlOiILMORvUGhWr9",
    });

    // Get the client with read-write access
    const rwClient = client.readWrite;

    // Enable automatic rate limit handling
    rwClient.rateLimitPlugin.removeAllListeners();
    rwClient.rateLimitPlugin.onRateLimitError(async (error) => {
      log(`Rate limit exceeded, waiting ${error.rateLimit.reset} seconds`, 'twitter');
      await new Promise(resolve => setTimeout(resolve, error.rateLimit.reset * 1000));
    });

    return rwClient;
  } catch (error: any) {
    log(`Failed to initialize Twitter client: ${error.message}`, 'twitter');
    throw new Error(`Twitter client initialization failed: ${error.message}`);
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet with text length: ${text.length}`, 'twitter');

    // Try to verify credentials first
    try {
      const user = await client.currentUser();
      log(`Verified Twitter credentials for user: ${user.username}`, 'twitter');
    } catch (verifyError: any) {
      log(`Failed to verify credentials: ${verifyError.message}`, 'twitter');
      throw verifyError;
    }

    // Post tweet with v1.1 API for better compatibility
    const tweet = await client.v1.tweet(text);

    if (!tweet?.id_str) {
      throw new Error("Failed to get tweet ID from response");
    }

    log(`Successfully posted tweet with ID: ${tweet.id_str}`, 'twitter');
  } catch (error: any) {
    const errorMessage = error.message || error.toString();
    log(`Failed to post tweet: ${errorMessage}`, 'twitter');
    if (error.data) {
      log(`Twitter API Error Details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    throw new Error(`Failed to post tweet: ${errorMessage}`);
  }
}