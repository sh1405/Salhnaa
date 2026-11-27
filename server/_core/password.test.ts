import { describe, expect, it } from "vitest";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";

describe("email password credentials", () => {
  it("stores a salted PBKDF2-SHA256 digest and verifies only the matching password", async () => {
    const encoded = await hashPassword("a-long-private-password");
    expect(encoded).toMatch(/^pbkdf2-sha256\$600000\$/);
    expect(await verifyPassword("a-long-private-password", encoded)).toBe(true);
    expect(await verifyPassword("a-different-password", encoded)).toBe(false);
  });

  it("rejects malformed hashes and normalizes email for exact account lookup", async () => {
    expect(await verifyPassword("anything", "plain-text-password")).toBe(false);
    expect(normalizeEmail("  User.Name+Tag@Example.COM ")).toBe("user.name+tag@example.com");
  });
});
