import { log } from "../vite";

async function testCredentialFormats() {
  try {
    // Get credentials
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY?.trim() || '',
      apiSecret: process.env.TWITTER_API_SECRET?.trim() || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim() || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim() || '',
    };

    // Expected formats
    const expectedFormats = {
      apiKey: {
        value: "4p0ZtIt0T0aZNoW3zgyF4gK1j",
        length: 25
      },
      apiSecret: {
        value: "GST88nNkZE1bdMcQAcYVwwunWKA5nbSIzuAa0XrwvTHxfzAkVn",
        length: 50
      },
      accessToken: {
        value: "1888979033922076672-Qw13Rdiq1OeyJ9d2vXSzbcGaIb4DLY",
        length: 49
      },
      accessSecret: {
        value: "okK2j2Jj99j6x3WCd718adZfNOGUDWP48ClPB1lyYl8ZW",
        length: 45
      }
    };

    // Log detailed comparison
    Object.entries(credentials).forEach(([key, value]) => {
      const expected = expectedFormats[key as keyof typeof expectedFormats];
      const actualFirstFour = value.substring(0, 4);
      const expectedFirstFour = expected.value.substring(0, 4);
      
      log(`${key}:`, 'credentials');
      log(`- Actual length: ${value.length} (Expected: ${expected.length})`, 'credentials');
      log(`- First 4 chars match: ${actualFirstFour === expectedFirstFour}`, 'credentials');
      log(`- Actual starts with: ${actualFirstFour}`, 'credentials');
      log(`- Expected starts with: ${expectedFirstFour}`, 'credentials');
      log(`- Contains Bearer token pattern: ${value.includes('AAAA')}`, 'credentials');
    });

  } catch (error: any) {
    log(`Test error: ${error.message}`, 'credentials');
  }
}

// Run the test
testCredentialFormats();
