import { TwitterApi } from "twitter-api-v2";

async function testTweepyStyle() {
  try {
    // Define credentials directly like Tweepy example
    const consumer_key = "koQUmGeIYEipj9jdRahkSL6lQ";
    const consumer_secret = "HkeQ1ZxmZt3z75kTUWshryzrvrxxkwWd0Izkl5UumOMwD8wi6C";
    const access_token = "1460679066672115714-jJlvyCdgxrhv5dAuBeOMUYxlWYE19C";
    const access_token_secret = "do3Q9gsQJyXg9OY5GgrbG1P0GvGprUEaelLipns1PypSs";

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
    console.log("\nPosting test tweet...");
    const tweet = await v2Client.tweet("Test tweet from Twitter API v2 - March 9, 2025");
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