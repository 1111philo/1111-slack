# 1111-slack

Daily summaries of 11:11 Philosopher's Group Slack conversations, committed as markdown files to this repo.

## Architecture

AWS Lambda on a daily cron (11:11 AM CST / 17:11 UTC) → fetches Slack messages → summarizes with Claude on Bedrock → commits to `summaries/` in this repo via GitHub API.

## Setup

### 1. Slack app

Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps) with bot token scopes:
- `channels:history` — read messages
- `channels:read` — list channels
- `users:read` — resolve display names

Install to workspace and invite the bot to channels you want summarized.

### 2. SSM parameters

Store secrets in AWS SSM Parameter Store:

```bash
aws ssm put-parameter --name /1111-slack/slack-bot-token --type SecureString --value "xoxb-..."
aws ssm put-parameter --name /1111-slack/github-token --type SecureString --value "ghp_..."
```

The GitHub token needs `contents: write` permission on this repo.

### 3. Deploy

```bash
sam build
sam deploy
```

## Output

Summaries are committed daily to the `summaries/` directory as `YYYY-MM-DD.md` files, one per day, with per-channel sections.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
