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

// Rate limit handling
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 45 * 60 * 1000; // 45 minutes between posts
const RATE_LIMIT_RESET = 15 * 60 * 1000; // 15 minutes for rate limit reset
let lastPostTime = 0;
let currentRetryCount = 0;
let retryDelay = INITIAL_RETRY_DELAY;

export async function postTweet(text: string): Promise<void> {
  const now = Date.now();
  const timeSinceLastPost = now - lastPostTime;
  
  // Ensure minimum interval between posts
  if (timeSinceLastPost < INITIAL_RETRY_DELAY) {
    const waitTime = Math.ceil((INITIAL_RETRY_DELAY - timeSinceLastPost) / 1000);
    log(`Rate limit: Waiting ${waitTime} seconds before next post`, 'twitter');
    throw new Error(`Rate limit: Please wait ${waitTime} seconds before next post`);
  }

  try {
    const client = getTwitterClient();
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, 'twitter');

    // Post tweet using v2 API
    await client.tweet(text);
    lastPostTime = now;
    currentRetryCount = 0;
    retryDelay = INITIAL_RETRY_DELAY;
    log(`Successfully posted tweet`, 'twitter');
  } catch (error: any) {
    if (error.code === 429) { // Rate limit error
      currentRetryCount++;
      if (currentRetryCount >= MAX_RETRIES) {
        currentRetryCount = 0;
        retryDelay = INITIAL_RETRY_DELAY;
        log(`Rate limit exceeded after ${MAX_RETRIES} retries, resetting counters`, 'twitter');
        throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(RATE_LIMIT_RESET / 1000 / 60)} minutes.`);
      }
      retryDelay = Math.max(RATE_LIMIT_RESET, retryDelay * 2); // Use at least 15 minutes for rate limit
      log(`Rate limit hit, will retry in ${Math.ceil(retryDelay / 1000 / 60)} minutes`, 'twitter');
      throw new Error(`Rate limit hit. Next retry in ${Math.ceil(retryDelay / 1000)} seconds.`);
    }

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