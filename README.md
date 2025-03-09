# Twitter Posting Platform

A secure Twitter posting platform with restricted authentication.

## Deployment Instructions

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel` in the project root
4. Set up the following environment variables in Vercel:
   - TWITTER_API_KEY
   - TWITTER_API_SECRET
   - TWITTER_ACCESS_TOKEN
   - TWITTER_ACCESS_SECRET
   - SESSION_SECRET (generate a random string)

## Authentication

- Only authorized email (EliteBizOpportunities@proton.me) can register
- Password reset available through al_razvan@yahoo.com
- Secure session management and password hashing

## Features

- Automated Twitter posting
- Schedule management
- Post tracking
- Secure authentication
