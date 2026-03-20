import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getChannels, getMessages, getUserNames } from "./slack.js";
import { summarizeChannel } from "./summarize.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUMMARIES_DIR = join(__dirname, "..", "summaries");

async function main() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`Generating summary for ${today}...`);

  const channels = await getChannels();
  console.log(`Found ${channels.length} channels`);

  const sections = [];
  const allUserIds = new Set();

  // Fetch messages from all channels
  const channelMessages = [];
  for (const ch of channels) {
    const messages = await getMessages(ch.id);
    if (messages.length === 0) continue;
    messages.forEach((m) => m.user && allUserIds.add(m.user));
    channelMessages.push({ channel: ch, messages });
  }

  if (channelMessages.length === 0) {
    console.log("No messages found in the last 24 hours.");
    return;
  }

  // Resolve user names
  const userNames = await getUserNames([...allUserIds]);

  // Summarize each active channel
  for (const { channel, messages } of channelMessages) {
    console.log(
      `Summarizing #${channel.name} (${messages.length} messages)...`
    );
    const summary = await summarizeChannel(channel.name, messages, userNames);
    sections.push(`## #${channel.name}\n\n${summary}`);
  }

  // Write markdown file
  const content = `# Slack Summary — ${today}\n\n${sections.join("\n\n---\n\n")}\n`;
  const filePath = join(SUMMARIES_DIR, `${today}.md`);
  await writeFile(filePath, content);
  console.log(`Saved to ${filePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
