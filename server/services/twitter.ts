import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient(): TwitterApi {
  const credentials = {
    appKey: process.env.TWITTER_API_KEY || 'AjQwmmc7fqs8KdMgc8KS0hONy',
    appSecret: process.env.TWITTER_API_SECRET || 'ARso268mRpDRVFZMH5AyDmmo3xirKOQBY8BP8El1OgxP7DbzsJ',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '1460679066672115714-elqvrB3Gi5XkdkhFrvNYx5jfjuuENP',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '05bENxVnuqRIVrrfOeWfKM9VQMsJzPlOiILMORvUGhWr9',
  };

  // Log available credentials (without exposing the actual values)
  log(`Twitter credentials status:
    API Key: ${credentials.appKey ? 'Present' : 'Missing'}
    API Secret: ${credentials.appSecret ? 'Present' : 'Missing'}
    Access Token: ${credentials.accessToken ? 'Present' : 'Missing'}
    Access Secret: ${credentials.accessSecret ? 'Present' : 'Missing'}
  `, 'twitter');

  try {
    // Create the client with the app-only credentials first
    const client = new TwitterApi({
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
    });

    // Create a client with user context
    const userClient = new TwitterApi({
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    return userClient;
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