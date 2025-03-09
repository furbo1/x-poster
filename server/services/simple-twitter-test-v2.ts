import { TwitterApi } from "twitter-api-v2";

async function testTwitterSetup() {
  try {
    // Define Keys (using same naming as working example)
    const consumer_key = process.env.TWITTER_API_KEY?.trim();
    const consumer_secret = process.env.TWITTER_API_SECRET?.trim();
    const access_token = process.env.TWITTER_ACCESS_TOKEN?.trim();
    const access_token_secret = process.env.TWITTER_ACCESS_SECRET?.trim();

    // Log credentials info for debugging
    console.log('Using credentials:');
    console.log(`Consumer key length: ${consumer_key?.length}`);
    console.log(`Consumer secret length: ${consumer_secret?.length}`);
    console.log(`Access token length: ${access_token?.length}`);
    console.log(`Access token secret length: ${access_token_secret?.length}`);

    // Create client exactly like Tweepy example
    const client = new TwitterApi({
      appKey: consumer_key,
      appSecret: consumer_secret,
      accessToken: access_token,
      accessSecret: access_token_secret,
    });

    // Test authentication
    console.log('Testing authentication...');
    const user = await client.v1.verifyCredentials();
    console.log('Authentication successful!');
    console.log(`Authenticated as: ${user.screen_name}`);

    // Try posting a test tweet
    console.log('Attempting to post test tweet...');
    const tweet = await client.v1.tweet('Test tweet from Twitter API v2');
    console.log(`Successfully posted tweet with ID: ${tweet.id_str}`);

    return true;
  } catch (error: any) {
    console.error('Test failed:');
    console.error(`Error message: ${error.message}`);
    if (error.data) {
      console.error(`Error data: ${JSON.stringify(error.data, null, 2)}`);
    }
    return false;
  }
}

// Run the test
testTwitterSetup().then((success) => {
  if (!success) {
    process.exit(1);
  }
});
