"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Mail,
  GitBranch,
  MessageSquare,
  ArrowRight,
  KeyRound,
  Loader2,
  Pencil,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreativeToggle } from "@/components/ui/creative-toggle";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { fadeUp, stagger } from "@/components/dashboard/motion";

interface ScopeInfo {
  scope: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  readWrite: "read" | "write";
}

const servicePermissions: {
  id: string;
  name: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
  scopes: ScopeInfo[];
}[] = [
  {
    id: "google",
    name: "Google",
    icon: Mail,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    scopes: [
      {
        scope: "gmail.readonly",
        description: "Read email messages and metadata",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "calendar.readonly",
        description: "View calendar events and details",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "calendar.freebusy",
        description: "Check availability without seeing event details",
        riskLevel: "low",
        readWrite: "read",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    icon: GitBranch,
    color: "text-white",
    bgColor: "bg-white/10",
    scopes: [
      {
        scope: "read:user",
        description: "Read user profile information",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "read:org",
        description: "Read organization membership",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "repo",
        description: "Full access to repositories (read + write)",
        riskLevel: "high",
        readWrite: "write",
      },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    scopes: [
      {
        scope: "channels:read",
        description: "View channel list and info",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "channels:history",
        description: "Read message history in channels",
        riskLevel: "medium",
        readWrite: "read",
      },
      {
        scope: "chat:write",
        description: "Send messages on behalf of user",
        riskLevel: "high",
        readWrite: "write",
      },
      {
        scope: "users:read",
        description: "View user profiles in workspace",
        riskLevel: "low",
        readWrite: "read",
      },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    icon: MessageSquare,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    scopes: [
      {
        scope: "identify",
        description: "Read user profile and avatar",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "guilds",
        description: "View server list and membership",
        riskLevel: "low",
        readWrite: "read",
      },
      {
        scope: "guilds.members.read",
        description: "View member info in servers",
        riskLevel: "medium",
        readWrite: "read",
      },
      {
        scope: "bot",
        description: "Send messages to channels (requires bot token)",
        riskLevel: "medium",
        readWrite: "write",
      },
    ],
  },
];

const riskColors = {
  low: { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" },
  medium: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  high: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
};

export function PermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [serviceAccess, setServiceAccess] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexus:serviceAccess");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return Object.fromEntries(servicePermissions.map((s) => [s.id, true]));
  });
  const [writeAccess, setWriteAccess] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexus:writeAccess");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return Object.fromEntries(servicePermissions.map((s) => [s.id, false]));
  });

  useEffect(() => {
    localStorage.setItem("nexus:serviceAccess", JSON.stringify(serviceAccess));
  }, [serviceAccess]);

  useEffect(() => {
    localStorage.setItem("nexus:writeAccess", JSON.stringify(writeAccess));
  }, [writeAccess]);

  const toggleServiceAccess = (id: string) => {
    setServiceAccess((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) setWriteAccess((w) => ({ ...w, [id]: false }));
      return next;
    });
  };

  const toggleWriteAccess = (id: string) => {
    if (!serviceAccess[id]) return;
    setWriteAccess((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch current permission states on mount
  useEffect(() => {
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.permissions) setPermissions(data.permissions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Toggle a single scope
  const toggleScope = useCallback(
    async (scope: string) => {
      const newValue = !permissions[scope];
      // Optimistic update
      setPermissions((prev) => ({ ...prev, [scope]: newValue }));
      setSaving(scope);

      try {
        const res = await fetch("/api/permissions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: { [scope]: newValue } }),
        });
        const data = await res.json();
        if (data.permissions) setPermissions(data.permissions);
      } catch (err) {
        // Revert on failure
        setPermissions((prev) => ({ ...prev, [scope]: !newValue }));
        console.error("Failed to update permission:", err);
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const isEnabled = (scope: string) => permissions[scope] !== false; // default true

  const totalScopes = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.length,
    0
  );
  const readScopes = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.filter((sc) => sc.readWrite === "read").length,
    0
  );
  const writeScopes = totalScopes - readScopes;
  const enabledCount = servicePermissions.reduce(
    (acc, s) => acc + s.scopes.filter((sc) => isEnabled(sc.scope)).length,
    0
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="space-y-6"
      >
        {/* Header */}
        <PageHeader
          icon={Shield}
          title="Permissions"
          description="Control exactly what your AI agent can access. Disable a scope to block the agent from using it, even if the service is connected."
        />

        {/* Stats */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={KeyRound}
              label="Total Scopes"
              value={totalScopes}
            />
            <StatCard
              icon={Eye}
              label="Read-Only"
              value={readScopes}
              color="text-green-400"
              bgColor="bg-green-400/10"
            />
            <StatCard
              icon={Lock}
              label="Write Access"
              value={writeScopes}
              color="text-yellow-400"
              bgColor="bg-yellow-400/10"
            />
            <StatCard
              icon={CheckCircle}
              label="Enabled"
              value={`${enabledCount}/${totalScopes}`}
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
            />
          </div>
        </motion.div>

        {/* Security Model Info */}
        <motion.div variants={fadeUp}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Server-side enforcement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  These toggles are enforced on the server before every tool
                  call. If you disable a scope, the agent is blocked from
                  using any tool that requires it. The request never reaches
                  the external API.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step-Up Auth Enforcement */}
        <motion.div variants={fadeUp}>
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Step-up authentication is enforced
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Write operations are blocked until you explicitly approve
                    each action. The agent cannot execute writes without human
                    authorization.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:ml-8">
                {["createGitHubIssue", "sendSlackMessage", "sendDiscordMessage"].map(
                  (tool) => (
                    <div
                      key={tool}
                      className="flex items-center gap-2 p-2 rounded-md bg-accent/20 border border-border/30"
                    >
                      <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span className="text-xs font-mono truncate">{tool}</span>
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground sm:ml-8">
                Approved actions create a step-up session valid for 10 minutes.
                All approvals and denials are logged in the audit trail.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Permissions */}
        {loading ? (
          <motion.div variants={fadeUp} className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading permissions...</span>
          </motion.div>
        ) : (
          servicePermissions.map((service) => {
            const Icon = service.icon;
            const serviceEnabled = serviceAccess[service.id];
            const enabledScopeCount = service.scopes.filter((s) => isEnabled(s.scope)).length;
            return (
              <motion.div key={service.id} variants={fadeUp}>
                <Card>
                  {/* Service header with master toggles */}
                  <CardHeader className="border-b [.border-b]:pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg ${serviceEnabled ? service.bgColor : "bg-muted/50"} flex items-center justify-center transition-colors shrink-0`}
                        >
                          <Icon className={`w-5 h-5 ${serviceEnabled ? service.color : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className={`text-base ${!serviceEnabled ? "text-muted-foreground" : ""}`}>
                            {service.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {serviceEnabled
                              ? `${enabledScopeCount} of ${service.scopes.length} scopes enabled`
                              : "All access blocked"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {serviceEnabled && (
                          <div className="flex items-center gap-2">
                            <Pencil
                              className={`w-3.5 h-3.5 ${
                                writeAccess[service.id]
                                  ? "text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              Write
                            </span>
                            <CreativeToggle
                              checked={writeAccess[service.id]}
                              onChange={() => toggleWriteAccess(service.id)}
                              color="yellow"
                              size="sm"
                            />
                          </div>
                        )}
                        {!serviceEnabled && (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground border-border bg-muted/30"
                          >
                            Disabled
                          </Badge>
                        )}
                        <CreativeToggle
                          checked={serviceEnabled}
                          onChange={() => toggleServiceAccess(service.id)}
                          color="emerald"
                          size="md"
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {/* Scope list */}
                  <CardContent
                    className={`divide-y divide-border/40 ${!serviceEnabled ? "opacity-50" : ""}`}
                  >
                    {service.scopes.map((scope) => {
                      const risk = riskColors[scope.riskLevel];
                      const enabled = serviceEnabled && isEnabled(scope.scope);
                      const isSaving = saving === scope.scope;
                      return (
                        <div
                          key={scope.scope}
                          className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {isSaving ? (
                              <div className="w-9 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="mt-0.5">
                                <CreativeToggle
                                  checked={enabled}
                                  onChange={() => toggleScope(scope.scope)}
                                  disabled={isSaving || !serviceEnabled}
                                  color={scope.readWrite === "write" ? "yellow" : "emerald"}
                                  size="sm"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`text-sm font-mono font-medium ${
                                    !enabled ? "text-muted-foreground" : ""
                                  }`}
                                >
                                  {scope.scope}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    scope.readWrite === "write"
                                      ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                                      : "text-green-400 border-green-400/30 bg-green-400/10"
                                  }`}
                                >
                                  {scope.readWrite === "write" ? (
                                    <><Pencil className="w-2.5 h-2.5 mr-1" />Write</>
                                  ) : (
                                    <><Eye className="w-2.5 h-2.5 mr-1" />Read</>
                                  )}
                                </Badge>
                                {scope.riskLevel !== "low" && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${risk.text} ${risk.border} ${risk.bg}`}
                                  >
                                    {scope.riskLevel === "high" ? (
                                      <><ShieldAlert className="w-2.5 h-2.5 mr-1" />High risk</>
                                    ) : (
                                      <><AlertTriangle className="w-2.5 h-2.5 mr-1" />Medium risk</>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {scope.description}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-medium shrink-0 mt-1 ${
                              enabled ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {enabled ? "Allowed" : "Blocked"}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}

        {/* Token Flow */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                Token Exchange Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  {
                    step: "1",
                    title: "User Request",
                    desc: "You ask Nexus to perform an action",
                  },
                  {
                    step: "2",
                    title: "Permission Check",
                    desc: "Server checks if you have enabled the required scopes",
                  },
                  {
                    step: "3",
                    title: "Risk Check",
                    desc: "Write ops are flagged for step-up auth; reads proceed directly",
                  },
                  {
                    step: "4",
                    title: "Token Exchange",
                    desc: "Auth0 exchanges refresh token for scoped access token",
                  },
                  {
                    step: "5",
                    title: "Audit Log",
                    desc: "Action and approval decision logged with scope and risk",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-3 rounded-lg bg-accent/20 text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center mx-auto mb-2">
                      {item.step}
                    </div>
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
