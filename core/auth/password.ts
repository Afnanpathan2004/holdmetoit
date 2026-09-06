import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Derives a secure password hash using scrypt with a unique random salt.
 * Format: `<hex_salt>:<hex_hash>`
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) {
      return false;
    }

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, KEY_LENGTH);

    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

