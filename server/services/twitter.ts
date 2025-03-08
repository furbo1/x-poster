import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient(): TwitterApi {
  try {
    // Create the client directly with user context
    const client = new TwitterApi({
      appKey: "AjQwmmc7fqs8KdMgc8KS0hONy",
      appSecret: "ARso268mRpDRVFZMH5AyDmmo3xirKOQBY8BP8El1OgxP7DbzsJ",
      accessToken: "1460679066672115714-elqvrB3Gi5XkdkhFrvNYx5jfjuuENP",
      accessSecret: "05bENxVnuqRIVrrfOeWfKM9VQMsJzPlOiILMORvUGhWr9",
    });

    return client;
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
      const user = await client.v1.verifyCredentials();
      log(`Verified Twitter credentials for user: ${user.screen_name}`, 'twitter');
    } catch (verifyError: any) {
      log(`Failed to verify credentials: ${verifyError.message}`, 'twitter');
      if (verifyError.data) {
        log(`Verification Error Details: ${JSON.stringify(verifyError.data)}`, 'twitter');
      }
      throw verifyError;
    }

    // Post the tweet using v1.1 API
    await client.v1.tweet(text);
    log(`Successfully posted tweet: ${text.substring(0, 50)}...`, 'twitter');
  } catch (error: any) {
    const errorMessage = error.message || error.toString();
    log(`Failed to post tweet: ${errorMessage}`, 'twitter');
    if (error.data) {
      log(`Twitter API Error Details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    throw new Error(`Failed to post tweet: ${errorMessage}`);
  }
}