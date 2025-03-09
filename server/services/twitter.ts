import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    // Define credentials that we know work
    const credentials = {
      apiKey: "4p0ZtIt0T0aZNoW3zgyF4gK1j",
      apiSecret: "GST88nNkZE1bdMcQAcYVwwunWKA5nbSIzuAa0XrwvTHxfzAkVn",
      accessToken: "1888979033922076672-Qw13Rdiq1OeyJ9d2vXSzbcGaIb4DLY",
      accessSecret: "okK2j2Jj99j6x3WCd718adZfNOGUDWP48ClPB1lyYl8ZW",
    };

    // Create client with OAuth 1.0a user context
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    // Return the v2 client since we need v2 endpoints
    return client.v2;
  } catch (error: any) {
    log(`Twitter client initialization error: ${error.message}`, 'twitter');
    throw error;
  }
}

export async function testAuth() {
  try {
    const client = getTwitterClient();
    log('Running detailed authentication test...', 'twitter');

    // Test credentials using v2 endpoint
    const user = await client.me();

    return {
      success: true,
      username: user.data.username,
      userId: user.data.id,
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

    // Post tweet using v2 API
    const tweet = await client.tweet(text);
    log(`Successfully posted tweet with ID: ${tweet.data.id}`, 'twitter');
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

    // Use v2.me() which is supported by our access level
    const user = await client.me();
    log(`Verified credentials for user: ${user.data.username}`, 'twitter');
    return true;
  } catch (error: any) {
    log(`Credential verification failed: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Error details: ${JSON.stringify(error.data)}`, 'twitter');
    }
    return false;
  }
}