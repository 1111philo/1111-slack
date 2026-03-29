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
      modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `You are summarizing a Slack conversation from #${channelName}. Produce a clean, concise markdown summary. Do NOT repeat or stutter words. Every word should appear only once.

Rules:
- Use bullet points for key topics, decisions, and action items.
- Mention people by name when relevant.
- If the conversation is trivial (just greetings, reactions, or very short), write one sentence saying so.
- Do NOT include a title or header — just the summary content.
- Do NOT duplicate any words or phrases.

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
