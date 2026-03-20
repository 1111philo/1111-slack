import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getChannels, getMessages, getUserNames } from "./slack.js";
import { summarizeChannel } from "./summarize.js";

const s3 = new S3Client();
const BUCKET = process.env.SUMMARIES_BUCKET;

export async function handler() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`Generating summary for ${today}...`);

  const channels = await getChannels();
  console.log(`Found ${channels.length} channels`);

  const allUserIds = new Set();
  const channelMessages = [];

  for (const ch of channels) {
    const messages = await getMessages(ch.id);
    if (messages.length === 0) continue;
    messages.forEach((m) => m.user && allUserIds.add(m.user));
    channelMessages.push({ channel: ch, messages });
  }

  if (channelMessages.length === 0) {
    console.log("No messages found in the last 24 hours.");
    return { status: "no_messages" };
  }

  const userNames = await getUserNames([...allUserIds]);
  const sections = [];

  for (const { channel, messages } of channelMessages) {
    console.log(`Summarizing #${channel.name} (${messages.length} messages)...`);
    const summary = await summarizeChannel(channel.name, messages, userNames);
    sections.push(`## #${channel.name}\n\n${summary}`);
  }

  const content = `# Slack Summary — ${today}\n\n${sections.join("\n\n---\n\n")}\n`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `summaries/${today}.md`,
      Body: content,
      ContentType: "text/markdown",
    })
  );

  console.log(`Saved to s3://${BUCKET}/summaries/${today}.md`);
  return { status: "ok", date: today, channels: channelMessages.length };
}
