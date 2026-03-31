import { auth0 } from "@/lib/auth0";
import { getManagementToken } from "@/lib/management";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Not logged in" });
  }

  const hasRefreshToken = !!session.tokenSet.refreshToken;
  const refreshTokenPreview = session.tokenSet.refreshToken
    ? session.tokenSet.refreshToken.substring(0, 10) + "..."
    : null;

  // Check user identities via Management API
  let identitiesFromMgmt = null;
  try {
    const mgmtToken = await getManagementToken();
    const domain = process.env.AUTH0_DOMAIN!;
    const userRes = await fetch(
      `https://${domain}/api/v2/users/${encodeURIComponent(session.user.sub)}?fields=identities`,
      { headers: { Authorization: `Bearer ${mgmtToken}` } }
    );
    const userData = await userRes.json();
    identitiesFromMgmt = userData.identities?.map(
      (i: { provider: string; connection: string; access_token?: string; refresh_token?: string }) => ({
        provider: i.provider,
        connection: i.connection,
        hasAccessToken: !!i.access_token,
        hasRefreshToken: !!i.refresh_token,
        accessTokenPreview: i.access_token ? i.access_token.substring(0, 15) + "..." : null,
      })
    );
  } catch (err) {
    identitiesFromMgmt = { error: String(err) };
  }

  // Try the token exchange manually
  const domain = process.env.AUTH0_AI_DOMAIN || process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_AI_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_AI_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

  const connections = ["google-oauth2", "github", "slack-oauth-2"];
  const exchangeResults: Record<string, unknown> = {};

  if (session.tokenSet.refreshToken) {
    for (const connection of connections) {
      try {
        const res = await fetch(`https://${domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type:
              "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
            client_id: clientId,
            client_secret: clientSecret,
            subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
            subject_token: session.tokenSet.refreshToken,
            connection,
            requested_token_type:
              "http://auth0.com/oauth/token-type/federated-connection-access-token",
          }),
        });
        exchangeResults[connection] = {
          status: res.status,
          body: await res.json(),
        };
      } catch (err) {
        exchangeResults[connection] = { error: String(err) };
      }
    }
  }

  return Response.json({
    user: session.user.sub,
    hasRefreshToken,
    refreshTokenPreview,
    identitiesFromMgmt,
    exchangeResults,
    config: {
      domain,
      clientId,
      hasClientSecret: !!clientSecret,
    },
  });
}
