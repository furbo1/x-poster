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

// Rate limit tracking
let lastPostTime: Date | null = null;
let rateLimitResetTime: Date | null = null;

const MIN_POST_INTERVAL = 45 * 60 * 1000; // 45 minutes in milliseconds
const RATE_LIMIT_WINDOW = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

export async function postTweet(text: string): Promise<void> {
  const now = new Date();

  // Check if we're still in rate limit window
  if (rateLimitResetTime && now < rateLimitResetTime) {
    const waitTimeSeconds = Math.ceil((rateLimitResetTime.getTime() - now.getTime()) / 1000);
    throw new Error(`Rate limit window active. Try again in ${waitTimeSeconds} seconds.`);
  }

  // Ensure minimum interval between posts
  if (lastPostTime) {
    const timeSinceLastPost = now.getTime() - lastPostTime.getTime();
    if (timeSinceLastPost < MIN_POST_INTERVAL) {
      const waitTimeMinutes = Math.ceil((MIN_POST_INTERVAL - timeSinceLastPost) / (60 * 1000));
      throw new Error(`Please wait ${waitTimeMinutes} minutes before posting again.`);
    }
  }

  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  });

  try {
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, "twitter");
    await client.v2.tweet(text);
    
    // Update last post time on success
    lastPostTime = now;
    rateLimitResetTime = null;
    
    log("Tweet posted successfully", "twitter");
  } catch (error: any) {
    // Handle rate limit errors
    if (error.code === 429 || (error.data && error.data.status === 429)) {
      rateLimitResetTime = new Date(now.getTime() + RATE_LIMIT_WINDOW);
      const waitTimeMinutes = Math.ceil(RATE_LIMIT_WINDOW / (60 * 1000));
      log(`Rate limit hit, will retry in ${waitTimeMinutes} minutes`, "twitter");
      throw new Error(`Rate limit hit. Next retry in ${RATE_LIMIT_WINDOW / 1000} seconds.`);
    }
    
    throw error;
  }
}

export async function verifyTwitterCredentials(): Promise<boolean> {
  try {
    log("Verifying Twitter credentials...", "twitter");
    
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    const user = await client.v2.me();
    log(`Verified credentials for user: ${user.data.username}`, "twitter");
    return true;
  } catch (error) {
    log(`Failed to verify Twitter credentials: ${error}`, "twitter");
    return false;
  }
}