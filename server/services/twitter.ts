import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Initialize with OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: "AjQwmmc7fqs8KdMgc8KS0hONy",
      appSecret: "ARso268mRpDRVFZMH5AyDmmo3xirKOQBY8BP8El1OgxP7DbzsJ",
      accessToken: "1460679066672115714-elqvrB3Gi5XkdkhFrvNYx5jfjuuENP",
      accessSecret: "05bENxVnuqRIVrrfOeWfKM9VQMsJzPlOiILMORvUGhWr9",
    }).readWrite;

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

    // Post the tweet
    const tweet = await client.v2.tweet(text);

    if (!tweet?.data?.id) {
      throw new Error("Failed to get tweet ID from response");
    }

    log(`Successfully posted tweet with ID: ${tweet.data.id}`, 'twitter');
  } catch (error: any) {
    const errorMessage = error.message || error.toString();
    log(`Failed to post tweet: ${errorMessage}`, 'twitter');
    if (error.data) {
      log(`Twitter API Error Details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    throw new Error(`Failed to post tweet: ${errorMessage}`);
  }
}