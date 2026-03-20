import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-east-2" });

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

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: "anthropic.claude-haiku-4-5-20251001-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Summarize this Slack conversation from #${channelName}. Write a concise summary capturing key topics, decisions, and action items. Use bullet points. If the conversation is trivial (just greetings, reactions, or very short), say so in one line.

Messages:
${formatted}`,
          },
        ],
      }),
    })
  );

  const body = JSON.parse(new TextDecoder().decode(res.body));
  return body.content[0].text;
}
