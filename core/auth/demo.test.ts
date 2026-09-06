import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeDemoUser, DEMO_CREDENTIALS } from "./demo";
import * as userRepo from "@/features/auth/data/user.repository";

vi.mock("@/features/auth/data/user.repository", () => ({
  getOrCreateDemoUser: vi.fn(),
}));

describe("Demo Account Authorization (core/auth/demo.ts)", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it("authorizes successfully with valid credentials in development", async () => {
    vi.mocked(userRepo.getOrCreateDemoUser).mockResolvedValueOnce({
      id: "usr-demo-123",
      email: DEMO_CREDENTIALS.email,
      name: DEMO_CREDENTIALS.displayName,
      displayName: DEMO_CREDENTIALS.displayName,
      username: "demo_admin",
      role: "ADMIN",
      image: null,
      discordId: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = await authorizeDemoUser({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe(DEMO_CREDENTIALS.email);
    expect(user?.role).toBe("ADMIN");
  });

  it("fails authorization with invalid password in development", async () => {
    const user = await authorizeDemoUser({
      email: DEMO_CREDENTIALS.email,
      password: "WrongPassword!",
    });

    expect(user).toBeNull();
    expect(userRepo.getOrCreateDemoUser).not.toHaveBeenCalled();
  });

  it("fails authorization with non-demo email", async () => {
    const user = await authorizeDemoUser({
      email: "random@holdmetoit.local",
      password: DEMO_CREDENTIALS.password,
    });

    expect(user).toBeNull();
  });

  it("unconditionally rejects demo credentials outside development (production)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const user = await authorizeDemoUser({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });

    expect(user).toBeNull();
    expect(userRepo.getOrCreateDemoUser).not.toHaveBeenCalled();
  });

  it("falls back to in-memory demo user if database is unreachable", async () => {
    vi.mocked(userRepo.getOrCreateDemoUser).mockRejectedValueOnce(
      new Error("Database connection refused"),
    );

    const user = await authorizeDemoUser({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });

    expect(user).not.toBeNull();
    expect(user?.id).toBe("usr-demo-dev");
    expect(user?.role).toBe("ADMIN");
    expect(user?.email).toBe(DEMO_CREDENTIALS.email);
  });
});

