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

// Twitter Free Tier Limits
const TWEETS_PER_DAY = 17;
const ACTIVE_HOURS = {
  start: 8, // 8 AM
  end: 23, // 11 PM
  endMinutes: 55 // 55 minutes
};

// Calculate active minutes per day
const ACTIVE_MINUTES_PER_DAY = (ACTIVE_HOURS.end - ACTIVE_HOURS.start) * 60 + ACTIVE_HOURS.endMinutes;
const MIN_INTERVAL = Math.floor(ACTIVE_MINUTES_PER_DAY / TWEETS_PER_DAY); // minutes between tweets during active hours

let lastPostTime: Date | null = null;
let dailyTweetCount = 0;
let dailyCountResetTime: Date | null = null;

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

  // Check if we're within active hours
  if (!isWithinActiveHours(now)) {
    const nextActive = getNextActiveTime(now);
    const waitMinutes = Math.ceil((nextActive.getTime() - now.getTime()) / (60 * 1000));
    throw new Error(`Outside active hours (${ACTIVE_HOURS.start}:00-${ACTIVE_HOURS.end}:${ACTIVE_HOURS.endMinutes}). Next window opens in ${waitMinutes} minutes.`);
  }

  // Reset daily count if it's a new day and we're in active hours
  const startOfDay = new Date(now);
  startOfDay.setHours(ACTIVE_HOURS.start, 0, 0, 0);
  if (!dailyCountResetTime || now >= dailyCountResetTime) {
    dailyTweetCount = 0;
    dailyCountResetTime = new Date(startOfDay);
    dailyCountResetTime.setDate(dailyCountResetTime.getDate() + 1);
  }

  // Check if we've hit the daily limit
  if (dailyTweetCount >= TWEETS_PER_DAY) {
    const nextReset = new Date(dailyCountResetTime);
    nextReset.setHours(ACTIVE_HOURS.start, 0, 0, 0);
    const waitMinutes = Math.ceil((nextReset.getTime() - now.getTime()) / (60 * 1000));
    throw new Error(`Daily tweet limit (${TWEETS_PER_DAY}) reached. Next window opens in ${waitMinutes} minutes.`);
  }

  // Check minimum interval during active hours
  if (lastPostTime) {
    const timeSinceLastPost = Math.floor((now.getTime() - lastPostTime.getTime()) / (60 * 1000));
    if (timeSinceLastPost < MIN_INTERVAL) {
      throw new Error(`Please wait ${MIN_INTERVAL - timeSinceLastPost} minutes before next tweet (minimum interval during active hours).`);
    }
  }

  const client = getTwitterClient();

  try {
    log(`Attempting to post tweet: "${text.substring(0, 20)}..."`, "twitter");
    await client.tweet(text);
    lastPostTime = now;
    dailyTweetCount++;
    log(`Tweet posted successfully (${dailyTweetCount}/${TWEETS_PER_DAY} today, next available in ${MIN_INTERVAL} minutes)`, "twitter");
  } catch (error: any) {
    if (error.code === 429 || (error.data && error.data.status === 429)) {
      const retryAfter = error.rateLimit?.reset ? new Date(error.rateLimit.reset * 1000) : new Date(now.getTime() + MIN_INTERVAL * 60 * 1000);
      const waitTimeMinutes = Math.ceil((retryAfter.getTime() - now.getTime()) / (60 * 1000));
      log(`Twitter rate limit hit, retry after ${waitTimeMinutes} minutes`, "twitter");
      throw new Error(`Twitter's rate limit reached. Please try again in ${waitTimeMinutes} minutes.`);
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