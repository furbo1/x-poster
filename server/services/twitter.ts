import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Initialize with Bearer token for v2 API
    const client = new TwitterApi(
      "AAAAAAAAAAAAAAAAAAAAAAPyzQEAAAAAXuoZ6CEzW9MdQnbu4SKDA9RVrxo%3DIgeggnw6OvD1PKJxcq5kP6TWORRIf5wP9kuEfHz9cORHibThXH"
    );

    return client.v2;
  } catch (error: any) {
    log(`Failed to initialize Twitter client: ${error.message}`, 'twitter');
    throw new Error(`Twitter client initialization failed: ${error.message}`);
  }
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet with text length: ${text.length}`, 'twitter');

    // Post the tweet using v2 API endpoint
    const response = await client.tweet(text);

    if (!response?.data?.id) {
      throw new Error("Failed to get tweet ID from response");
    }

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