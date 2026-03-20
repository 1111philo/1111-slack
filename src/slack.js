import { WebClient } from "@slack/web-api";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

let slack;

async function getClient() {
  if (slack) return slack;
  const ssm = new SSMClient();
  const res = await ssm.send(
    new GetParameterCommand({
      Name: process.env.SLACK_TOKEN_PARAM,
      WithDecryption: true,
    })
  );
  slack = new WebClient(res.Parameter.Value);
  return slack;
}

/** Fetch all public channels the bot is a member of. */
export async function getChannels() {
  const client = await getClient();
  const channels = [];
  let cursor;
  do {
    const res = await client.conversations.list({
      types: "public_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });
    // Only include channels the bot is a member of
    channels.push(...(res.channels || []).filter((c) => c.is_member));
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return channels;
}

/** Fetch messages from a channel in the last 24 hours. */
export async function getMessages(channelId) {
  const client = await getClient();
  const oldest = String(Math.floor(Date.now() / 1000) - 86400);
  const messages = [];
  let cursor;
  do {
    const res = await client.conversations.history({
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

/** Post a message to a channel by name. */
export async function postMessage(channelName, text) {
  const client = await getClient();
  const channels = await getChannels();
  const channel = channels.find((c) => c.name === channelName);
  if (!channel) throw new Error(`Channel #${channelName} not found or bot not a member`);
  await client.chat.postMessage({ channel: channel.id, text });
}

/** Look up display names for a set of user IDs. */
export async function getUserNames(userIds) {
  const client = await getClient();
  const names = {};
  for (const id of userIds) {
    try {
      const res = await client.users.info({ user: id });
      names[id] =
        res.user.profile.display_name || res.user.real_name || res.user.name;
    } catch {
      names[id] = id;
    }
  }
  return names;
}
