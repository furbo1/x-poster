# Twitter Posting Platform

A secure Twitter posting platform with restricted authentication.

## Deployment Instructions (Render.com)

1. Create a Render account at https://render.com
2. Connect your repository to Render
3. Create a new Web Service
4. Set up the following environment variables in Render:
   - TWITTER_API_KEY
   - TWITTER_API_SECRET
   - TWITTER_ACCESS_TOKEN
   - TWITTER_ACCESS_SECRET
   - SESSION_SECRET (will be auto-generated)

The render.yaml file will handle the rest of the configuration automatically.

## Authentication

- Only authorized email (EliteBizOpportunities@proton.me) can register
- Password reset available through al_razvan@yahoo.com
- Secure session management and password hashing

## Features

- Automated Twitter posting
- Schedule management
- Post tracking
- Secure authentication