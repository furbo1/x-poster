import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

async function testTwitterAuth() {
  try {
    // Get and validate credentials
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY?.trim() || '',
      apiSecret: process.env.TWITTER_API_SECRET?.trim() || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim() || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim() || '',
    };

    // Log credential details without exposing them
    Object.entries(credentials).forEach(([key, value]) => {
      log(`${key}:`, 'twitter-test');
      log(`- Length: ${value.length}`, 'twitter-test');
      log(`- First char: ${value.charAt(0)}`, 'twitter-test');
      log(`- Last char: ${value.charAt(value.length - 1)}`, 'twitter-test');
      log(`- Contains spaces: ${/\s/.test(value)}`, 'twitter-test');
      log(`- Valid chars only: ${/^[A-Za-z0-9\-_]+$/.test(value)}`, 'twitter-test');
    });

    // Create Twitter client
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    // Test authentication
    const result = await client.v1.verifyCredentials();
    log('Authentication successful!', 'twitter-test');
    log(`Authenticated as: ${result.screen_name}`, 'twitter-test');
    return true;
  } catch (error: any) {
    log('Authentication test failed:', 'twitter-test');
    log(`Error message: ${error.message}`, 'twitter-test');
    if (error.data) {
      log(`Error data: ${JSON.stringify(error.data, null, 2)}`, 'twitter-test');
    }
    return false;
  }
}

export { testTwitterAuth };
