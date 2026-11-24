export type InvitationRoute = "delivered_inbox" | "pending_delivery";

function toWesternDigits(input: string) {
  return input.replace(/[٠-٩۰-۹]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/** Normalize common Saudi mobile forms to E.164; other countries require +countrycode. */
export function normalizePhoneNumber(input: string): string | null {
  const normalized = toWesternDigits(input).trim().replace(/[\s().-]/g, "");
  if (!normalized) return null;
  const compact = normalized.startsWith("00") ? `+${normalized.slice(2)}` : normalized;

  if (/^05\d{8}$/.test(compact)) return `+966${compact.slice(1)}`;
  if (/^5\d{8}$/.test(compact)) return `+966${compact}`;
  if (/^9665\d{8}$/.test(compact)) return `+${compact}`;
  if (/^\+9665\d{8}$/.test(compact)) return compact;
  if (compact.startsWith("+966")) return null;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  return null;
}

export function decideInvitationRoute(matchedAccountId: number | null, senderUserId: number): InvitationRoute {
  if (matchedAccountId !== null && matchedAccountId === senderUserId) {
    throw new Error("لا يمكن توجيه الدعوة إلى حسابك نفسه");
  }
  return matchedAccountId === null ? "pending_delivery" : "delivered_inbox";
}

export function isInvitationExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
