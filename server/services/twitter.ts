import { TwitterApi } from "twitter-api-v2";
import { log } from "../vite";

function getTwitterClient() {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || "4p0ZtIt0T0aZNoW3zgyF4gK1j",
      appSecret: process.env.TWITTER_API_SECRET || "GST88nNkZE1bdMcQAcYVwwunWKA5nbSIzuAa0XrwvTHxfzAkVn",
      accessToken: process.env.TWITTER_ACCESS_TOKEN || "1888979033922076672-Qw13Rdiq1OeyJ9d2vXSzbcGaIb4DLY",
      accessSecret: process.env.TWITTER_ACCESS_SECRET || "okK2j2Jj99j6x3WCd718adZfNOGUDWP48ClPB1lyYl8ZW",
    });

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

// Active hours configuration
const ACTIVE_HOURS = {
  start: 8, // 8 AM
  end: 23, // 11 PM
  endMinutes: 55 // 55 minutes
};

function isWithinActiveHours(date: Date): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (hours < ACTIVE_HOURS.start) return false;
  if (hours > ACTIVE_HOURS.end) return false;
  if (hours === ACTIVE_HOURS.end && minutes > ACTIVE_HOURS.endMinutes) return false;
  
  return true;
}

function getNextActiveTime(date: Date): Date {
  const next = new Date(date);
  
  if (next.getHours() < ACTIVE_HOURS.start) {
    next.setHours(ACTIVE_HOURS.start, 0, 0, 0);
  } else if (next.getHours() >= ACTIVE_HOURS.end && next.getMinutes() > ACTIVE_HOURS.endMinutes) {
    next.setDate(next.getDate() + 1);
    next.setHours(ACTIVE_HOURS.start, 0, 0, 0);
  }
  
  return next;
}

export async function postTweet(text: string): Promise<void> {
  const now = new Date();

  // Only check active hours for scheduled posts, not manual ones
  if (!isWithinActiveHours(now)) {
    const nextActive = getNextActiveTime(now);
    const waitMinutes = Math.ceil((nextActive.getTime() - now.getTime()) / (60 * 1000));
    throw new Error(`Outside active hours (${ACTIVE_HOURS.start}:00-${ACTIVE_HOURS.end}:${ACTIVE_HOURS.endMinutes}). Next window opens in ${waitMinutes} minutes.`);
  }

  const client = getTwitterClient();

  try {
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, "twitter");
    await client.tweet(text);
    log("Tweet posted successfully", "twitter");
  } catch (error: any) {
    // Only handle Twitter's own rate limits
    if (error.code === 429 || (error.data && error.data.status === 429)) {
      const retryAfter = error.rateLimit?.reset ? error.rateLimit.reset * 1000 : Date.now() + 5 * 60 * 1000;
      const waitMinutes = Math.ceil((retryAfter - Date.now()) / (60 * 1000));
      log(`Twitter rate limit hit, retry after ${waitMinutes} minutes`, "twitter");
      throw new Error(`Twitter's rate limit reached. Please try again in ${waitMinutes} minutes.`);
    }
    throw error;
  }
}

export async function verifyTwitterCredentials(): Promise<boolean> {
  try {
    log("Verifying Twitter credentials...", "twitter");
    const client = getTwitterClient();
    const user = await client.me();
    log(`Verified credentials for user: ${user.data.username}`, "twitter");
    return true;
  } catch (error) {
    log(`Failed to verify Twitter credentials: ${error}`, "twitter");
    return false;
  }
}