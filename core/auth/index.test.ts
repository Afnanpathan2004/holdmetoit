import { describe, expect, it, vi } from "vitest";

const capturedConfig: any = {};

vi.mock("next-auth", () => ({
  default: vi.fn((config: any) => {
    Object.assign(capturedConfig, config);
    return {
      handlers: { GET: vi.fn(), POST: vi.fn() },
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  }),
}));

vi.mock("next-auth/providers/discord", () => ({
  default: vi.fn((options: any) => ({
    id: "discord",
    name: "Discord",
    type: "oauth",
    options,
  })),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn((options: any) => ({
    id: "google",
    name: "Google",
    type: "oauth",
    options,
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((options: any) => ({
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    ...options,
  })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

describe("Auth.js NextAuth Configuration (core/auth/index.ts)", () => {
  it("configures Discord, Google, and Credentials providers", async () => {
    await import("./index");

    expect(capturedConfig.providers).toBeDefined();
    expect(capturedConfig.providers.length).toBe(3);

    const providerIds = capturedConfig.providers.map((p: any) => p.id);
    expect(providerIds).toContain("discord");
    expect(providerIds).toContain("google");
    expect(providerIds).toContain("credentials");
  });

  it("configures session strategy to 'jwt' and signIn page to '/login'", async () => {
    await import("./index");

    expect(capturedConfig.session?.strategy).toBe("jwt");
    expect(capturedConfig.pages?.signIn).toBe("/login");
  });

  it("attaches user fields in jwt callback", async () => {
    await import("./index");

    const jwtCallback = capturedConfig.callbacks?.jwt;
    expect(typeof jwtCallback).toBe("function");

    const token = await jwtCallback({
      token: {},
      user: {
        id: "u-test-1",
        name: "Test User",
        displayName: "Tester",
        username: "test_user",
        role: "ADMIN",
        discordId: "disc-999",
      },
    });

    expect(token.id).toBe("u-test-1");
    expect(token.displayName).toBe("Tester");
    expect(token.role).toBe("ADMIN");
    expect(token.discordId).toBe("disc-999");
  });

  it("hydrates session user from token in session callback", async () => {
    await import("./index");

    const sessionCallback = capturedConfig.callbacks?.session;
    expect(typeof sessionCallback).toBe("function");

    const session = await sessionCallback({
      session: { user: {} },
      token: {
        id: "u-test-1",
        displayName: "Tester",
        username: "test_user",
        role: "ADMIN",
        discordId: "disc-999",
      },
    });

    expect(session.user.id).toBe("u-test-1");
    expect(session.user.displayName).toBe("Tester");
    expect(session.user.role).toBe("ADMIN");
    expect(session.user.discordId).toBe("disc-999");
  });
});

