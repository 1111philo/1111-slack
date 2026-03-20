import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/** Fetch all public channels the bot is a member of. */
export async function getChannels() {
  const channels = [];
  let cursor;
  do {
    const res = await slack.conversations.list({
      types: "public_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });
    channels.push(...(res.channels || []));
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return channels;
}

/** Fetch messages from a channel in the last 24 hours. */
export async function getMessages(channelId) {
  const oldest = String(Math.floor(Date.now() / 1000) - 86400);
  const messages = [];
  let cursor;
  do {
    const res = await slack.conversations.history({
      channel: channelId,
      oldest,
      limit: 200,
      cursor,
    });
    messages.push(...(res.messages || []));
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);

  // Filter out bot messages and subtypes like joins/leaves
  return messages
    .filter((m) => !m.bot_id && (!m.subtype || m.subtype === "file_share"))
    .reverse(); // chronological order
}

/** Look up display names for a set of user IDs. */
export async function getUserNames(userIds) {
  const names = {};
  for (const id of userIds) {
    try {
      const res = await slack.users.info({ user: id });
      names[id] =
        res.user.profile.display_name || res.user.real_name || res.user.name;
    } catch {
      names[id] = id;
    }
  }
  return names;
}
