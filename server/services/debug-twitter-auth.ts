import { log } from "../vite";

async function debugTwitterCredentials() {
  try {
    // Get credentials
    const creds = {
      consumer_key: process.env.TWITTER_API_KEY?.trim() || '',
      consumer_secret: process.env.TWITTER_API_SECRET?.trim() || '',
      access_token: process.env.TWITTER_ACCESS_TOKEN?.trim() || '',
      access_token_secret: process.env.TWITTER_ACCESS_SECRET?.trim() || ''
    };

    // Log detailed credential info
    Object.entries(creds).forEach(([key, value]) => {
      log(`${key}:`, 'twitter-debug');
      log(`- Length: ${value.length}`, 'twitter-debug');
      log(`- First char: ${value.charAt(0)}`, 'twitter-debug');
      log(`- Last char: ${value.charAt(value.length - 1)}`, 'twitter-debug');
      log(`- Contains spaces: ${/\s/.test(value)}`, 'twitter-debug');
      log(`- Valid chars only: ${/^[A-Za-z0-9\-_]+$/.test(value)}`, 'twitter-debug');
    });

    // Expected formats
    const formatChecks = {
      consumer_key: /^[A-Za-z0-9]{25}$/,
      consumer_secret: /^[A-Za-z0-9]{50}$/,
      access_token: /^\d+-[A-Za-z0-9]{40}$/,
      access_token_secret: /^[A-Za-z0-9]{45}$/
    };

    // Check formats
    Object.entries(formatChecks).forEach(([key, regex]) => {
      const value = creds[key as keyof typeof creds];
      log(`${key} format valid: ${regex.test(value)}`, 'twitter-debug');
      if (!regex.test(value)) {
        log(`${key} format mismatch - expected pattern: ${regex}`, 'twitter-debug');
      }
    });

  } catch (error: any) {
    log(`Debug error: ${error.message}`, 'twitter-debug');
  }
}

// Run debug check
debugTwitterCredentials();
