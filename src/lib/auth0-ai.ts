import { Auth0AI } from "@auth0/ai-vercel";
import { auth0 } from "./auth0";
import { getUpstreamToken } from "./management";

export const auth0AI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID!,
    clientSecret:
      process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET!,
  },
});

// Token Vault authorizers (used when upstream refresh tokens are available)
export const withGoogleAccess = auth0AI.withTokenVault({
  connection: "google-oauth2",
  scopes: [
    "openid",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet.refreshToken!;
  },
});

export const withGitHubAccess = auth0AI.withTokenVault({
  connection: "github",
  scopes: ["repo", "read:user", "read:org"],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet.refreshToken!;
  },
});

export const withSlackAccess = auth0AI.withTokenVault({
  connection: "slack-oauth-2",
  scopes: ["channels:read", "chat:write", "users:read", "channels:history"],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet.refreshToken!;
  },
});

/**
 * Get access token for a connection.
 * Tries Token Vault exchange first, falls back to Management API.
 */
export async function getAccessToken(connection: string): Promise<string> {
  const session = await auth0.getSession();
  if (!session) throw new Error("Not authenticated");

  // Try Token Vault exchange first
  const domain = process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET!;

  if (session.tokenSet.refreshToken) {
    try {
      const res = await fetch(`https://${domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
          client_id: clientId,
          client_secret: clientSecret,
          subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
          subject_token: session.tokenSet.refreshToken,
          connection,
          requested_token_type: "http://auth0.com/oauth/token-type/federated-connection-access-token",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[auth] Token Vault success for ${connection}`);
        return data.access_token;
      }
      const errBody = await res.text();
      console.log(`[auth] Token Vault failed for ${connection}: ${res.status} - ${errBody}`);
    } catch (e) {
      console.log(`[auth] Token Vault exception for ${connection}:`, e);
    }
  } else {
    console.log(`[auth] No refresh token in session, skipping Token Vault for ${connection}`);
  }

  // Fallback: get upstream token via Management API
  console.log(`[auth] Trying Management API fallback for ${connection}...`);
  const token = await getUpstreamToken(session.user.sub, connection);
  if (token) {
    console.log(`[auth] Management API success for ${connection}`);
    return token;
  }

  console.log(`[auth] No token found for ${connection} via any method`);
  throw new Error(`No access token available for ${connection}. Please connect this service from the Connections page.`);
}
