# Twitter Posting Platform

A secure Twitter posting platform with restricted authentication.

## Deployment Options

### Option 1: Render.com (Recommended)
1. Create a Render account at https://render.com
2. Connect your repository:
   - Click "New +" button
   - Select "Web Service"
   - Choose "Connect your GitHub account"
   - Select your repository from the list

3. Configure deployment:
   - Name: Choose a name for your service
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `NODE_ENV=production node dist/index.js`

4. Set up environment variables:
   - TWITTER_API_KEY
   - TWITTER_API_SECRET
   - TWITTER_ACCESS_TOKEN
   - TWITTER_ACCESS_SECRET
   - SESSION_SECRET (will be auto-generated)

The render.yaml file will handle the rest of the configuration automatically.

### Option 2: Vercel
1. Create a Vercel account at https://vercel.com
2. Connect your repository to Vercel
3. Set up the following environment variables:
   - TWITTER_API_KEY
   - TWITTER_API_SECRET
   - TWITTER_ACCESS_TOKEN
   - TWITTER_ACCESS_SECRET
   - SESSION_SECRET (generate a secure random string)

The vercel.json file contains all necessary deployment configurations.

## Authentication

- Only authorized email (EliteBizOpportunities@proton.me) can register
- Password reset available through al_razvan@yahoo.com
- Secure session management and password hashing

## Features

- Automated Twitter posting
- Schedule management
- Post tracking
- Secure authentication