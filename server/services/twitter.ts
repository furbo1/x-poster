import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient(): TwitterApi {
  const credentials = {
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  };

  // Log available credentials (without exposing the actual values)
  log(`Twitter credentials status:
    API Key: ${credentials.appKey ? 'Present' : 'Missing'}
    API Secret: ${credentials.appSecret ? 'Present' : 'Missing'}
    Access Token: ${credentials.accessToken ? 'Present' : 'Missing'}
    Access Secret: ${credentials.accessSecret ? 'Present' : 'Missing'}
  `, 'twitter');

  if (!credentials.appKey || !credentials.appSecret || 
      !credentials.accessToken || !credentials.accessSecret) {
    throw new Error("Missing Twitter credentials. Please ensure all required environment variables are set.");
  }

  return new TwitterApi(credentials);
}

export async function postTweet(text: string): Promise<void> {
  try {
    const client = getTwitterClient();
    await client.v2.tweet(text);
    log(`Successfully posted tweet: ${text.substring(0, 50)}...`, 'twitter');
  } catch (error: any) {
    log(`Failed to post tweet: ${error.message}`, 'twitter');
    throw new Error(`Failed to post tweet: ${error.message}`);
  }
}