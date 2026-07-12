"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Link2,
  Shield,
  Activity,
  ArrowRight,
  Mail,
  KeyRound,
  Zap,
  CheckCircle,
  ShieldAlert,
  Lock,
  Network,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { fadeUp, stagger } from "@/components/dashboard/motion";
import type { AuditEntry } from "@/lib/types";

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
}

function QuickAction({ icon: Icon, title, description, color, bgColor, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="transition-colors cursor-pointer group h-full hover:bg-accent/30">
        <CardContent className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardOverview({
  userName,
  userAvatar,
}: {
  userName: string;
  userAvatar?: string;
}) {
  const [auditStats, setAuditStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    stepUpCount: number;
  } | null>(null);
  const [recentEntries, setRecentEntries] = useState<AuditEntry[]>([]);
  const [connectionsCount, setConnectionsCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        setAuditStats(data.stats || null);
        setRecentEntries((data.entries || []).slice(0, 5));
      })
      .catch(() => {});
    fetch("/api/connections")
      .then((res) => res.json())
      .then((data) => {
        const services = (data.services || []) as { connected?: boolean }[];
        setConnectionsCount(services.filter((s) => s.connected).length);
      })
      .catch(() => {});
  }, []);

  const successRate =
    auditStats && auditStats.total > 0
      ? Math.round(((auditStats.byStatus?.success || 0) / auditStats.total) * 100)
      : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto"
    >
      {/* Welcome Section */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-border">
              <AvatarImage src={userAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, {userName.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground text-sm">
                Your AI agent is ready to help
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/chat">
              <Button size="sm" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                New Chat
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Activity}
          label="Total Actions"
          value={auditStats?.total || 0}
        />
        <StatCard
          icon={CheckCircle}
          label="Successful"
          value={auditStats?.byStatus?.success || 0}
          trend={successRate !== null ? `${successRate}% rate` : undefined}
          color="text-green-400"
          bgColor="bg-green-400/10"
        />
        <StatCard
          icon={ShieldAlert}
          label="Step-up Auth"
          value={auditStats?.stepUpCount || 0}
          color="text-yellow-400"
          bgColor="bg-yellow-400/10"
        />
        <StatCard
          icon={Lock}
          label="Connections"
          value={connectionsCount ?? "—"}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions - 2 columns on large screens */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction
              icon={MessageSquare}
              title="Chat with Agent"
              description="Start a conversation"
              href="/dashboard/chat"
              color="text-primary"
              bgColor="bg-primary/10"
            />
            <QuickAction
              icon={Link2}
              title="Connections"
              description="Manage your services"
              href="/dashboard/connections"
              color="text-blue-400"
              bgColor="bg-blue-400/10"
            />
            <QuickAction
              icon={Shield}
              title="Permissions"
              description="View access scopes"
              href="/dashboard/permissions"
              color="text-green-400"
              bgColor="bg-green-400/10"
            />
            <QuickAction
              icon={Activity}
              title="Audit Trail"
              description="Review activity"
              href="/dashboard/audit"
              color="text-orange-400"
              bgColor="bg-orange-400/10"
            />
          </div>
        </motion.div>

        {/* Architecture Flow */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">You</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[10px] text-muted-foreground">You</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Network className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Nexus</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-green-400/10 flex items-center justify-center border border-green-400/20">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Vault</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground -mt-4" />
                <div className="flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Services</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure token-based authentication with minimal privileges
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  Recent Activity
                </CardTitle>
                <Link href="/dashboard/audit">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {auditStats && auditStats.total > 0 ? (
                <div className="space-y-2">
                  {recentEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.riskLevel === "low" ? "bg-green-500" :
                          entry.riskLevel === "medium" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                        <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">{entry.action}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            entry.riskLevel === "low"
                              ? "text-green-400 border-green-400/30"
                              : entry.riskLevel === "medium"
                              ? "text-yellow-400 border-yellow-400/30"
                              : "text-red-400 border-red-400/30"
                          }`}
                        >
                          {entry.riskLevel}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground/70">Start chatting to see your activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Get Started CTA */}
        <motion.div variants={fadeUp}>
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 h-full">
            <CardContent className="pt-6 h-full flex flex-col">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Ready to get started?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your services and start chatting with your AI agent for secure, scoped access.
                </p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/connections" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Link2 className="w-4 h-4" />
                    Connect Services
                  </Button>
                </Link>
                <Link href="/dashboard/chat" className="block">
                  <Button className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Start Chatting
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
