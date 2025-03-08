import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function validateAndTrimCredential(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is missing or empty`);
  }
  const trimmed = value.trim();
  log(`${name} length: ${trimmed.length} chars`, 'twitter');
  return trimmed;
}

function getTwitterClient() {
  try {
    // Validate and trim credentials
    const apiKey = validateAndTrimCredential(process.env.TWITTER_API_KEY, 'API Key');
    const apiSecret = validateAndTrimCredential(process.env.TWITTER_API_SECRET, 'API Secret');
    const accessToken = validateAndTrimCredential(process.env.TWITTER_ACCESS_TOKEN, 'Access Token');
    const accessSecret = validateAndTrimCredential(process.env.TWITTER_ACCESS_SECRET, 'Access Secret');

    // Log truncated versions for debugging
    log(`Using credentials:`, 'twitter');
    log(`- API Key: ${apiKey.substring(0, 5)}...`, 'twitter');
    log(`- Access Token: ${accessToken.substring(0, 5)}...`, 'twitter');

    // Create client with OAuth 1.0a user context
    const client = new TwitterApi({
      // Using the correct parameter names for OAuth 1.0a
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
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

// New verification function
export async function verifyTwitterCredentials(): Promise<boolean> {
  try {
    const client = getTwitterClient();
    log('Attempting to verify Twitter credentials...', 'twitter');

    // Try to get user information as a test
    const user = await client.v1.verifyCredentials();
    log(`Successfully verified credentials for user: ${user.screen_name}`, 'twitter');
    return true;
  } catch (error: any) {
    log(`Credential verification failed: ${error.message}`, 'twitter');
    if (error.data) {
      log(`Verification Error Details: ${JSON.stringify(error.data, null, 2)}`, 'twitter');
    }
    return false;
  }
}