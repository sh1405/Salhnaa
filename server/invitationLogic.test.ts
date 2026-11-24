import { describe, expect, it } from "vitest";
import { decideInvitationRoute, isInvitationExpired, normalizePhoneNumber } from "./invitationLogic";

describe("Saudi phone normalization for invitation matching", () => {
  it.each([
    ["0501234567", "+966501234567"],
    ["501234567", "+966501234567"],
    ["966501234567", "+966501234567"],
    ["+966 50 123 4567", "+966501234567"],
    ["٠٥٠١٢٣٤٥٦٧", "+966501234567"],
    ["۰۰۹۶۶۵۰۱۲۳۴۵۶۷", "+966501234567"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it.each(["", "123", "051234567", "+966151234567", "050-abc-4567"]) (
    "rejects invalid or unsupported number %s",
    input => expect(normalizePhoneNumber(input)).toBeNull(),
  );
});

describe("invitation routing and lifecycle", () => {
  it("routes a matched registered account to its inbox", () => {
    expect(decideInvitationRoute(42, 7)).toBe("delivered_inbox");
  });

  it("keeps an unmatched number pending delivery, not sent", () => {
    expect(decideInvitationRoute(null, 7)).toBe("pending_delivery");
  });

  it("prevents sending an invitation to the sender account", () => {
    expect(() => decideInvitationRoute(7, 7)).toThrow();
  });

  it("treats an invitation as expired at its expiry instant", () => {
    const expiry = new Date("2026-01-01T00:00:00.000Z");
    expect(isInvitationExpired(expiry, new Date(expiry.getTime() - 1))).toBe(false);
    expect(isInvitationExpired(expiry, expiry)).toBe(true);
  });
});
