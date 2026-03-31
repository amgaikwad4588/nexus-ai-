import { tool } from "ai";
import { z } from "zod";
import { getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { withDiscordAccess } from "@/lib/auth0-ai";
import { addAuditEntry } from "@/lib/audit";

export const getDiscordProfile = withDiscordAccess(
  tool({
    description: "Get the authenticated user's Discord profile information.",
    inputSchema: z.object({}),
    execute: async () => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "Get Discord profile",
        service: "discord",
        scopes: ["identify"],
        status: "success",
        details: "Retrieved Discord user profile via Token Vault",
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const err = await response.text();
        return { error: `Discord API error: ${response.status} - ${err}` };
      }

      const user = await response.json();
      return {
        id: user.id,
        username: user.username,
        globalName: user.global_name,
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        email: user.email,
      };
    },
  })
);

export const listDiscordGuilds = withDiscordAccess(
  tool({
    description:
      "List Discord servers (guilds) the authenticated user is a member of.",
    inputSchema: z.object({}),
    execute: async () => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: "List Discord servers",
        service: "discord",
        scopes: ["guilds"],
        status: "success",
        details: "Listed Discord guilds via Token Vault",
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        "https://discord.com/api/v10/users/@me/guilds",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return { error: `Discord API error: ${response.status} - ${err}`, guilds: [] };
      }

      const guilds = await response.json();
      return {
        guilds: guilds.map(
          (g: {
            id: string;
            name: string;
            icon: string | null;
            owner: boolean;
            permissions: string;
          }) => ({
            id: g.id,
            name: g.name,
            icon: g.icon
              ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
              : null,
            isOwner: g.owner,
          })
        ),
      };
    },
  })
);

export const getDiscordGuildMember = withDiscordAccess(
  tool({
    description:
      "Get the authenticated user's membership details in a specific Discord server, including roles and nickname.",
    inputSchema: z.object({
      guildId: z.string().describe("The Discord server (guild) ID"),
    }),
    execute: async ({ guildId }) => {
      const accessToken = getAccessTokenFromTokenVault();

      addAuditEntry({
        action: `Get Discord membership for guild ${guildId}`,
        service: "discord",
        scopes: ["guilds.members.read"],
        status: "success",
        details: `Retrieved membership info for guild ${guildId} via Token Vault`,
        riskLevel: "low",
        stepUpRequired: false,
      });

      const response = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return { error: `Discord API error: ${response.status} - ${err}` };
      }

      const member = await response.json();
      return {
        nickname: member.nick,
        roles: member.roles,
        joinedAt: member.joined_at,
        avatar: member.avatar,
      };
    },
  })
);
