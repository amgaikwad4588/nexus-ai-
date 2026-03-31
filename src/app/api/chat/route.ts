import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { setAIContext } from "@auth0/ai-vercel";
import { auth0 } from "@/lib/auth0";
import { searchGmail, checkCalendar } from "@/lib/tools/google";
import {
  listGitHubRepos,
  getGitHubIssues,
  createGitHubIssue,
  getGitHubProfile,
} from "@/lib/tools/github";
import {
  listSlackChannels,
  sendSlackMessage,
  getSlackChannelHistory,
} from "@/lib/tools/slack";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    const threadID = `nexus-${session.user.sub}-${Date.now()}`;

    setAIContext({ threadID });

    const model = google("gemini-3.1-flash-lite-preview");
    const modelMessages = await convertToModelMessages(messages);

    const tools = {
      searchGmail,
      checkCalendar,
      listGitHubRepos,
      getGitHubIssues,
      createGitHubIssue,
      getGitHubProfile,
      listSlackChannels,
      sendSlackMessage,
      getSlackChannelHistory,
    };

    const result = streamText({
      model,
      system: `You are Nexus, a powerful AI agent that helps users manage their digital life across Google, GitHub, and Slack. You have secure access to the user's connected services through Auth0 Token Vault.

Your capabilities:
- **Google**: Search Gmail, check Google Calendar events and availability
- **GitHub**: List repositories, view issues, create issues, get profile info
- **Slack**: List channels, send messages, read channel history

Security Model — Step-Up Authentication:
- **Read operations** (searching, listing, viewing) execute immediately with scoped tokens.
- **Write operations** (createGitHubIssue, sendSlackMessage) are protected by step-up authentication. When you call a write tool, it will NOT execute immediately. Instead, it queues the action for user approval and returns a requiresApproval response.
- When you receive a requiresApproval response from a write tool, tell the user that the action has been queued and they need to approve it using the authorization buttons shown in the chat. Do NOT retry the tool call.
- After the user approves or denies, the result will be handled automatically by the UI.

Guidelines:
- Always be helpful, concise, and transparent about what actions you're taking
- When performing actions, explain what you're doing and which service you're accessing
- If a tool returns an authorization error, do NOT retry it. Instead tell the user to connect that service from the Connections page.
- Format responses nicely with markdown
- When showing lists, use tables or bullet points for clarity
- Only call one tool at a time. Do not call multiple tools in parallel.

The user's name is ${session.user.name || "there"}.`,
      messages: modelMessages,
      tools,
      maxRetries: 0,
      stopWhen: stepCountIs(2),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
