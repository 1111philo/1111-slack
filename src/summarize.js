import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

const client = new AnthropicBedrock({ awsRegion: "us-east-2" });

/**
 * Summarize a channel's messages into a concise markdown section.
 */
export async function summarizeChannel(channelName, messages, userNames) {
  const formatted = messages
    .map((m) => {
      const name = userNames[m.user] || m.user || "unknown";
      const time = new Date(parseFloat(m.ts) * 1000).toLocaleTimeString(
        "en-US",
        { hour: "numeric", minute: "2-digit" }
      );
      return `[${time}] ${name}: ${m.text}`;
    })
    .join("\n");

  const res = await client.messages.create({
    model: "us.anthropic.claude-sonnet-4-5-20250514-v1:0",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Summarize this Slack conversation from #${channelName}. Write a concise summary capturing key topics, decisions, and action items. Use bullet points. If the conversation is trivial (just greetings, reactions, or very short), say so in one line.

Messages:
${formatted}`,
      },
    ],
  });

  return res.content[0].text;
}
