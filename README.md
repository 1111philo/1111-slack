# 1111-slack

Daily summaries of 11:11 Philosopher's Group Slack conversations, saved as markdown files.

## Setup

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps) with these bot token scopes:
   - `channels:history` — read messages
   - `channels:read` — list channels
   - `users:read` — resolve display names

2. Install the app to the workspace and invite the bot to channels you want summarized.

3. Copy `.env.example` to `.env` and fill in your tokens:
   ```
   cp .env.example .env
   ```

4. Install dependencies:
   ```
   npm install
   ```

## Usage

```
npm start
```

Generates a summary of the last 24 hours of Slack activity and saves it to `summaries/YYYY-MM-DD.md`.

## Output

Summaries are saved in the `summaries/` directory as markdown files, one per day, with per-channel sections.
