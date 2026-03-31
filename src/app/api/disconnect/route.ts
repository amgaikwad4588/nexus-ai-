import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getManagementToken } from "@/lib/management";

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, connection } = await request.json();
  if (!provider || !connection) {
    return NextResponse.json(
      { error: "Missing provider or connection" },
      { status: 400 }
    );
  }

  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN;
  const primaryUserId = session.user.sub;

  // Fetch user identities to find the one matching the provider/connection
  const userRes = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}?fields=identities`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!userRes.ok) {
    console.error("[Nexus] Failed to fetch user for disconnect:", userRes.status);
    return NextResponse.json(
      { error: "Failed to fetch user identities" },
      { status: 500 }
    );
  }

  const user = await userRes.json();
  const identities: { provider: string; connection: string; user_id: string }[] =
    user.identities || [];

  // Find the secondary identity that matches the requested provider/connection
  // Skip the primary identity (index 0) — it cannot be unlinked
  const identity = identities.find(
    (id, index) =>
      index > 0 &&
      (id.connection === connection || id.provider === provider)
  );

  if (!identity) {
    return NextResponse.json(
      { error: "Identity not found or is the primary identity" },
      { status: 404 }
    );
  }

  // Unlink the identity using the Management API
  const unlinkRes = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}/identities/${encodeURIComponent(identity.provider)}/${encodeURIComponent(identity.user_id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!unlinkRes.ok) {
    const errorText = await unlinkRes.text();
    console.error("[Nexus] Failed to unlink identity:", unlinkRes.status, errorText);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }

  console.log(
    `[Nexus] Unlinked ${identity.provider}|${identity.connection} from ${primaryUserId}`
  );

  return NextResponse.json({ success: true });
}
