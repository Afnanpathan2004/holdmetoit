import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  findUserById,
  findUserByDiscordId,
  countUsers,
  syncUserFromGoogleProfile,
  getOrCreateDemoUser,
  promoteFirstUserToAdminIfNeeded,
} from "./user.repository";
import { prisma } from "@/core/db";

vi.mock("@/core/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("User Repository (features/auth/data/user.repository.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds user by id", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u-1",
      name: "Afnan",
    } as any);

    const user = await findUserById("u-1");
    expect(user?.id).toBe("u-1");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "u-1" } });
  });

  it("finds user by discord id", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "u-1",
      discordId: "disc-123",
    } as any);

    const user = await findUserByDiscordId("disc-123");
    expect(user?.discordId).toBe("disc-123");
  });

  it("counts total users", async () => {
    vi.mocked(prisma.user.count).mockResolvedValueOnce(5);

    const count = await countUsers();
    expect(count).toBe(5);
  });

  it("syncs user fields from Google profile", async () => {
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "u-google-1",
      name: "Jane Doe",
      displayName: "Jane Doe",
      username: "jane.doe",
      image: "https://lh3.googleusercontent.com/avatar.png",
    } as any);

    const user = await syncUserFromGoogleProfile("u-google-1", {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      image: "https://lh3.googleusercontent.com/avatar.png",
    });

    expect(user.displayName).toBe("Jane Doe");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u-google-1" },
      data: {
        name: "Jane Doe",
        displayName: "Jane Doe",
        username: "jane.doe",
        image: "https://lh3.googleusercontent.com/avatar.png",
      },
    });
  });

  it("getOrCreateDemoUser returns existing demo user promoted to ADMIN", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "usr-demo-existing",
      email: "demo@holdmetoit.local",
      role: "PARTICIPANT",
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "usr-demo-existing",
      email: "demo@holdmetoit.local",
      role: "ADMIN",
    } as any);

    const user = await getOrCreateDemoUser();
    expect(user.role).toBe("ADMIN");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "usr-demo-existing" },
      data: { role: "ADMIN" },
    });
  });

  it("getOrCreateDemoUser creates demo user if not existing", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "usr-demo-dev",
      email: "demo@holdmetoit.local",
      name: "Demo Admin",
      displayName: "Demo Admin",
      username: "demo_admin",
      role: "ADMIN",
    } as any);

    const user = await getOrCreateDemoUser();
    expect(user.email).toBe("demo@holdmetoit.local");
    expect(user.role).toBe("ADMIN");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: "usr-demo-dev",
        email: "demo@holdmetoit.local",
        name: "Demo Admin",
        displayName: "Demo Admin",
        username: "demo_admin",
        role: "ADMIN",
      },
    });
  });

  it("promotes first registered user to ADMIN", async () => {
    vi.mocked(prisma.user.count).mockResolvedValueOnce(1);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: "u-first",
      role: "ADMIN",
    } as any);

    const role = await promoteFirstUserToAdminIfNeeded("u-first");
    expect(role).toBe("ADMIN");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u-first" },
      data: { role: "ADMIN" },
    });
  });

  it("does not promote user if other users already exist", async () => {
    vi.mocked(prisma.user.count).mockResolvedValueOnce(2);

    const role = await promoteFirstUserToAdminIfNeeded("u-second");
    expect(role).toBeNull();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

