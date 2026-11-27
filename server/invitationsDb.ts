import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { mediationCases, mediationInvitations, users } from "../drizzle/schema";
import { fromIso, getD1Database, toIso } from "../cloudflare/runtime";
import { getDb } from "./db";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

function mapInvitationDates<T extends Record<string, unknown>>(row: T): T {
  const mapped = { ...row } as Record<string, unknown>;
  for (const field of ["createdAt", "expiresAt", "openedAt", "respondedAt"]) {
    if (mapped[field] != null) mapped[field] = fromIso(mapped[field]);
  }
  return mapped as T;
}

type InvitationStatus = "pending_delivery" | "delivered_inbox" | "opened" | "responded" | "cancelled" | "expired";
type InvitationResponse = "accepted" | "declined" | null;
type InboxInvitation = { id: number; caseId: number; status: InvitationStatus; response: InvitationResponse; createdAt: Date; expiresAt: Date; openedAt: Date | null; senderName: string | null };
type SentInvitation = { id: number; caseId: number; status: InvitationStatus; response: InvitationResponse; createdAt: Date; expiresAt: Date; recipientUserId: number | null };
type FullInvitation = { id: number; caseId: number; senderUserId: number; recipientUserId: number | null; tokenHash?: string; status: InvitationStatus; response: InvitationResponse; expiresAt: Date; senderName?: string | null; createdAt?: Date; openedAt?: Date | null; respondedAt?: Date | null };

export async function findUserByPhone(phoneE164: string) {
  const d1 = getD1Database();
  if (d1) return (await d1.prepare("SELECT id FROM users WHERE phoneE164 = ? LIMIT 1").bind(phoneE164).first<{ id: number }>()) ?? null;
  const db = await requireDb();
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.phoneE164, phoneE164)).limit(1);
  return rows[0] ?? null;
}

export async function getPhoneForUser(userId: number) {
  const d1 = getD1Database();
  if (d1) {
    const row = await d1.prepare("SELECT phoneE164 FROM users WHERE id = ? LIMIT 1").bind(userId).first<{ phoneE164: string | null }>();
    return row?.phoneE164 ?? null;
  }
  const db = await requireDb();
  const rows = await db.select({ phoneE164: users.phoneE164 }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.phoneE164 ?? null;
}

export async function savePhoneForUser(userId: number, phoneE164: string | null) {
  const d1 = getD1Database();
  if (d1) {
    await d1.prepare("UPDATE users SET phoneE164 = ?, updatedAt = ? WHERE id = ?")
      .bind(phoneE164, toIso(new Date()), userId).run();
    return;
  }
  const db = await requireDb();
  await db.update(users).set({ phoneE164 }).where(eq(users.id, userId));
}

export async function getOwnedSafeCase(userId: number, caseId: number) {
  const d1 = getD1Database();
  if (d1) {
    const row = await d1.prepare("SELECT id, safety, status FROM mediationCases WHERE id = ? AND userId = ? LIMIT 1")
      .bind(caseId, userId).first<{ id: number; safety: string; status: string }>();
    return row ?? null;
  }
  const db = await requireDb();
  const rows = await db.select({ id: mediationCases.id, safety: mediationCases.safety, status: mediationCases.status })
    .from(mediationCases)
    .where(and(eq(mediationCases.id, caseId), eq(mediationCases.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createInvitation(values: {
  caseId: number;
  senderUserId: number;
  recipientUserId: number | null;
  tokenHash: string;
  status: "pending_delivery" | "delivered_inbox";
  expiresAt: Date;
}) {
  const d1 = getD1Database();
  if (d1) {
    const result = await d1.prepare("INSERT INTO mediationInvitations (caseId, senderUserId, recipientUserId, tokenHash, status, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(values.caseId, values.senderUserId, values.recipientUserId, values.tokenHash, values.status, toIso(new Date()), toIso(values.expiresAt)).run();
    const id = Number(result.meta?.last_row_id ?? 0);
    if (!id) throw new Error("Failed to create invitation");
    return id;
  }
  const db = await requireDb();
  const rows = await db.insert(mediationInvitations).values(values).$returningId();
  if (!rows[0]) throw new Error("Failed to create invitation");
  return rows[0].id;
}

export async function listInbox(userId: number) {
  const d1 = getD1Database();
  if (d1) {
    const { results } = await d1.prepare("SELECT i.id, i.caseId, i.status, i.response, i.createdAt, i.expiresAt, i.openedAt, u.name AS senderName FROM mediationInvitations i JOIN users u ON i.senderUserId = u.id WHERE i.recipientUserId = ? AND i.status IN ('delivered_inbox','opened','responded') ORDER BY i.createdAt DESC")
      .bind(userId).all<Record<string, unknown>>();
    return results.map(row => mapInvitationDates(row) as unknown as InboxInvitation);
  }
  const db = await requireDb();
  return db.select({
    id: mediationInvitations.id,
    caseId: mediationInvitations.caseId,
    status: mediationInvitations.status,
    response: mediationInvitations.response,
    createdAt: mediationInvitations.createdAt,
    expiresAt: mediationInvitations.expiresAt,
    openedAt: mediationInvitations.openedAt,
    senderName: users.name,
  }).from(mediationInvitations)
    .innerJoin(users, eq(mediationInvitations.senderUserId, users.id))
    .where(and(eq(mediationInvitations.recipientUserId, userId), or(eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"), eq(mediationInvitations.status, "responded"))))
    .orderBy(desc(mediationInvitations.createdAt));
}

export async function listSent(userId: number) {
  const d1 = getD1Database();
  if (d1) {
    const { results } = await d1.prepare("SELECT id, caseId, status, response, createdAt, expiresAt, recipientUserId FROM mediationInvitations WHERE senderUserId = ? ORDER BY createdAt DESC")
      .bind(userId).all<Record<string, unknown>>();
    return results.map(row => mapInvitationDates(row) as unknown as SentInvitation);
  }
  const db = await requireDb();
  return db.select({
    id: mediationInvitations.id,
    caseId: mediationInvitations.caseId,
    status: mediationInvitations.status,
    response: mediationInvitations.response,
    createdAt: mediationInvitations.createdAt,
    expiresAt: mediationInvitations.expiresAt,
    recipientUserId: mediationInvitations.recipientUserId,
  }).from(mediationInvitations)
    .where(eq(mediationInvitations.senderUserId, userId))
    .orderBy(desc(mediationInvitations.createdAt));
}

export async function getInvitationByTokenHash(tokenHash: string) {
  const d1 = getD1Database();
  if (d1) {
    const row = await d1.prepare("SELECT i.id, i.caseId, i.senderUserId, i.recipientUserId, i.tokenHash, i.status, i.response, i.expiresAt, u.name AS senderName FROM mediationInvitations i JOIN users u ON i.senderUserId = u.id WHERE i.tokenHash = ? LIMIT 1")
      .bind(tokenHash).first<Record<string, unknown>>();
    return row ? mapInvitationDates(row) as unknown as FullInvitation : null;
  }
  const db = await requireDb();
  const rows = await db.select({
    id: mediationInvitations.id,
    caseId: mediationInvitations.caseId,
    senderUserId: mediationInvitations.senderUserId,
    recipientUserId: mediationInvitations.recipientUserId,
    tokenHash: mediationInvitations.tokenHash,
    status: mediationInvitations.status,
    response: mediationInvitations.response,
    expiresAt: mediationInvitations.expiresAt,
    senderName: users.name,
  }).from(mediationInvitations)
    .innerJoin(users, eq(mediationInvitations.senderUserId, users.id))
    .where(eq(mediationInvitations.tokenHash, tokenHash))
    .limit(1);
  return rows[0] ?? null;
}

export async function claimAndOpenInvitation(id: number, userId: number, allowClaim: boolean) {
  const d1 = getD1Database();
  if (d1) {
    const claimant = allowClaim ? "recipientUserId IS NULL" : "recipientUserId = ?";
    const values: unknown[] = [userId, toIso(new Date()), id];
    if (!allowClaim) values.push(userId);
    await d1.prepare(`UPDATE mediationInvitations SET recipientUserId = ?, status = 'opened', openedAt = ? WHERE id = ? AND status IN ('pending_delivery','delivered_inbox') AND ${claimant}`)
      .bind(...values).run();
    return getInvitationById(id);
  }
  const db = await requireDb();
  const conditions = [eq(mediationInvitations.id, id), or(eq(mediationInvitations.status, "pending_delivery"), eq(mediationInvitations.status, "delivered_inbox"))];
  if (allowClaim) conditions.push(isNull(mediationInvitations.recipientUserId));
  else conditions.push(eq(mediationInvitations.recipientUserId, userId));
  await db.update(mediationInvitations).set({ recipientUserId: userId, status: "opened", openedAt: new Date() }).where(and(...conditions));
  return getInvitationById(id);
}

export async function getInvitationById(id: number) {
  const d1 = getD1Database();
  if (d1) {
    const row = await d1.prepare("SELECT * FROM mediationInvitations WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>();
    return row ? mapInvitationDates(row) as unknown as FullInvitation : null;
  }
  const db = await requireDb();
  const rows = await db.select().from(mediationInvitations).where(eq(mediationInvitations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function respondToInvitation(id: number, userId: number, response: "accepted" | "declined") {
  const d1 = getD1Database();
  if (d1) {
    const result = await d1.prepare("UPDATE mediationInvitations SET status = 'responded', response = ?, respondedAt = ?, recipientUserId = ? WHERE id = ? AND recipientUserId = ? AND status IN ('delivered_inbox','opened')")
      .bind(response, toIso(new Date()), userId, id, userId).run();
    return (result.meta?.changes ?? 0) > 0;
  }
  const db = await requireDb();
  const [result] = await db.update(mediationInvitations).set({ status: "responded", response, respondedAt: new Date(), recipientUserId: userId })
    .where(and(eq(mediationInvitations.id, id), eq(mediationInvitations.recipientUserId, userId), or(eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"))));
  return result.affectedRows > 0;
}

export async function expireInvitation(id: number) {
  const d1 = getD1Database();
  if (d1) {
    await d1.prepare("UPDATE mediationInvitations SET status = 'expired' WHERE id = ? AND expiresAt < ? AND status IN ('pending_delivery','delivered_inbox','opened')")
      .bind(id, toIso(new Date())).run();
    return;
  }
  const db = await requireDb();
  await db.update(mediationInvitations).set({ status: "expired" })
    .where(and(eq(mediationInvitations.id, id), lt(mediationInvitations.expiresAt, new Date()), or(eq(mediationInvitations.status, "pending_delivery"), eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"))));
}

export async function cancelInvitation(id: number, senderUserId: number) {
  const d1 = getD1Database();
  if (d1) {
    const result = await d1.prepare("UPDATE mediationInvitations SET status = 'cancelled' WHERE id = ? AND senderUserId = ? AND status IN ('pending_delivery','delivered_inbox','opened')")
      .bind(id, senderUserId).run();
    return (result.meta?.changes ?? 0) > 0;
  }
  const db = await requireDb();
  const [result] = await db.update(mediationInvitations).set({ status: "cancelled" })
    .where(and(eq(mediationInvitations.id, id), eq(mediationInvitations.senderUserId, senderUserId), or(eq(mediationInvitations.status, "pending_delivery"), eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"))));
  return result.affectedRows > 0;
}
