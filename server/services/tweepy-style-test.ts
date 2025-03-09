import { TwitterApi } from "twitter-api-v2";

async function testTweepyStyle() {
  try {
    // Define credentials directly like Tweepy example
    const consumer_key = "4p0ZtIt0T0aZNoW3zgyF4gK1j";
    const consumer_secret = "GST88nNkZE1bdMcQAcYVwwunWKA5nbSIzuAa0XrwvTHxfzAkVn";
    const access_token = "1888979033922076672-Qw13Rdiq1OeyJ9d2vXSzbcGaIb4DLY";
    const access_token_secret = "okK2j2Jj99j6x3WCd718adZfNOGUDWP48ClPB1lyYl8ZW";

    console.log("Initializing with credentials:");
    console.log(`Consumer key: ${consumer_key.substring(0, 4)}...${consumer_key.substring(consumer_key.length - 4)}`);
    console.log(`Consumer secret: ${consumer_secret.substring(0, 4)}...${consumer_secret.substring(consumer_secret.length - 4)}`);
    console.log(`Access token: ${access_token.substring(0, 4)}...${access_token.substring(access_token.length - 4)}`);
    console.log(`Access token secret: ${access_token_secret.substring(0, 4)}...${access_token_secret.substring(access_token_secret.length - 4)}`);

    // Create client with OAuth 1.0a user context
    const client = new TwitterApi({
      appKey: consumer_key,
      appSecret: consumer_secret,
      accessToken: access_token,
      accessSecret: access_token_secret,
    });

    // Get v2 client for endpoints that require it
    const v2Client = client.v2;

    // Verify credentials using v2 endpoint
    console.log("\nVerifying credentials...");
    const user = await v2Client.me();
    console.log("Authentication successful!");
    console.log(`Logged in as: ${user.data.username}`);

    // Post test tweet using v2 endpoint
    console.log("\nPosting tweet...");
    const tweet = await v2Client.tweet("Hello winners!");
    console.log(`Tweet posted successfully! ID: ${tweet.data.id}`);

    return true;
  } catch (error: any) {
    console.error("Error occurred:");
    console.error(`Message: ${error.message}`);
    if (error.data) {
      console.error("Error details:", JSON.stringify(error.data, null, 2));
    }
    return false;
  }
}

// Run the test
testTweepyStyle().then((success) => {
  if (!success) {
    process.exit(1);
  }
});