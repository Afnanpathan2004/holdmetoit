import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMemberRoles, isDiscordAdmin } from "./discord-guild.service";

describe("discord-guild.service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe("fetchMemberRoles", () => {
    it("returns empty array when env vars are missing", async () => {
      delete process.env.DISCORD_GUILD_ID;
      delete process.env.DISCORD_BOT_TOKEN;

      const roles = await fetchMemberRoles("12345");
      expect(roles).toEqual([]);
    });

    it("returns roles array when Discord API responds with member", async () => {
      process.env.DISCORD_GUILD_ID = "guild_123";
      process.env.DISCORD_BOT_TOKEN = "bot_secret";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ roles: ["role_1", "role_2"] }),
      });
      global.fetch = mockFetch;

      const roles = await fetchMemberRoles("user_456");
      expect(roles).toEqual(["role_1", "role_2"]);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://discord.com/api/v10/guilds/guild_123/members/user_456",
        expect.objectContaining({
          headers: { Authorization: "Bot bot_secret" },
        }),
      );
    });

    it("returns empty array if Discord API responds with error status", async () => {
      process.env.DISCORD_GUILD_ID = "guild_123";
      process.env.DISCORD_BOT_TOKEN = "bot_secret";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const roles = await fetchMemberRoles("user_not_in_server");
      expect(roles).toEqual([]);
    });

    it("returns empty array if fetch throws network error", async () => {
      process.env.DISCORD_GUILD_ID = "guild_123";
      process.env.DISCORD_BOT_TOKEN = "bot_secret";

      global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));

      const roles = await fetchMemberRoles("user_network_error");
      expect(roles).toEqual([]);
    });
  });

  describe("isDiscordAdmin", () => {
    it("returns true if user Discord ID is in DISCORD_ADMIN_IDS whitelist", async () => {
      process.env.DISCORD_ADMIN_IDS = "737561189755912223, 999999999999999999";

      const isAdmin = await isDiscordAdmin("737561189755912223");
      expect(isAdmin).toBe(true);
    });

    it("returns true if user has a role matching DISCORD_ADMIN_ROLE_IDS", async () => {
      process.env.DISCORD_GUILD_ID = "guild_123";
      process.env.DISCORD_BOT_TOKEN = "bot_secret";
      process.env.DISCORD_ADMIN_ROLE_IDS = "admin_role_a, admin_role_b";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ roles: ["member_role", "admin_role_b"] }),
      });

      const isAdmin = await isDiscordAdmin("user_with_admin_role");
      expect(isAdmin).toBe(true);
    });

    it("returns false if user does not possess any admin role", async () => {
      process.env.DISCORD_GUILD_ID = "guild_123";
      process.env.DISCORD_BOT_TOKEN = "bot_secret";
      process.env.DISCORD_ADMIN_ROLE_IDS = "admin_role_a, admin_role_b";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ roles: ["regular_member", "student"] }),
      });

      const isAdmin = await isDiscordAdmin("regular_user");
      expect(isAdmin).toBe(false);
    });

    it("returns false if user is empty string or undefined", async () => {
      const isAdmin = await isDiscordAdmin("");
      expect(isAdmin).toBe(false);
    });
  });
});
