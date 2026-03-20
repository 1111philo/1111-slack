# 1111-slack

Daily summaries of 11:11 Philosopher's Group Slack conversations, saved as markdown files to S3.

## Architecture

AWS Lambda on a daily cron (6 AM UTC) → fetches Slack messages → summarizes with Claude → writes to S3.

## Setup

### 1. Slack app

Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps) with bot token scopes:
- `channels:history` — read messages
- `channels:read` — list channels
- `users:read` — resolve display names

Install to workspace and invite the bot to channels you want summarized.

### 2. SSM parameter

Store the Slack bot token in AWS SSM Parameter Store:

```bash
aws ssm put-parameter --name /1111-slack/slack-bot-token --type SecureString --value "xoxb-..."
```

No Anthropic API key needed — uses Claude on Amazon Bedrock via the Lambda's IAM role.

### 3. Deploy

```bash
sam build
sam deploy
```

## Output

Summaries are saved to the `1111-slack-summaries` S3 bucket as `summaries/YYYY-MM-DD.md`, one per day, with per-channel sections.
