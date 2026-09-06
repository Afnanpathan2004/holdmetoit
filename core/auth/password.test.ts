import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Cryptography Utilities", () => {
  it("generates a distinct hash with random salt on each call", () => {
    const pass = "HoldMeToIt123!";
    const hash1 = hashPassword(pass);
    const hash2 = hashPassword(pass);

    expect(hash1).not.toBe(hash2);
    expect(hash1).toContain(":");
  });

  it("verifies matching password correctly", () => {
    const pass = "SuperSecret456!";
    const hash = hashPassword(pass);

    expect(verifyPassword(pass, hash)).toBe(true);
  });

  it("rejects incorrect password", () => {
    const hash = hashPassword("CorrectPassword123!");

    expect(verifyPassword("WrongPassword123!", hash)).toBe(false);
    expect(verifyPassword("", hash)).toBe(false);
    expect(verifyPassword("correctpassword123!", hash)).toBe(false);
  });

  it("returns false for malformed or corrupted hashes gracefully", () => {
    expect(verifyPassword("any", "")).toBe(false);
    expect(verifyPassword("any", "invalidsaltandkey")).toBe(false);
    expect(verifyPassword("any", "invalid:not-hex-chars!")).toBe(false);
  });
});

