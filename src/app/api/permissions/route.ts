import { auth0 } from "@/lib/auth0";
import { getUserPermissions, setUserPermissions } from "@/lib/permissions";

// GET /api/permissions — return current user's scope toggle states
export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = getUserPermissions(session.user.sub);
  return Response.json({ permissions });
}

// PUT /api/permissions — bulk-update scope toggles
// Body: { permissions: { "repo": true, "chat:write": false, ... } }
export async function PUT(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { permissions } = await req.json();
  if (!permissions || typeof permissions !== "object") {
    return Response.json({ error: "Invalid body — expected { permissions: { scope: bool } }" }, { status: 400 });
  }

  setUserPermissions(session.user.sub, permissions);

  return Response.json({ permissions: getUserPermissions(session.user.sub) });
}
