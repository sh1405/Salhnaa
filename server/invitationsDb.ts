import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { mediationCases, mediationInvitations, users } from "../drizzle/schema";
import { getDb } from "./db";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function findUserByPhone(phoneE164: string) {
  const db = await requireDb();
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.phoneE164, phoneE164)).limit(1);
  return rows[0] ?? null;
}

export async function getPhoneForUser(userId: number) {
  const db = await requireDb();
  const rows = await db.select({ phoneE164: users.phoneE164 }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.phoneE164 ?? null;
}

export async function savePhoneForUser(userId: number, phoneE164: string | null) {
  const db = await requireDb();
  await db.update(users).set({ phoneE164 }).where(eq(users.id, userId));
}

export async function getOwnedSafeCase(userId: number, caseId: number) {
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
  const db = await requireDb();
  const rows = await db.insert(mediationInvitations).values(values).$returningId();
  if (!rows[0]) throw new Error("Failed to create invitation");
  return rows[0].id;
}

export async function listInbox(userId: number) {
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
  const db = await requireDb();
  return db.select({
    id: mediationInvitations.id,
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
  const db = await requireDb();
  const conditions = [eq(mediationInvitations.id, id), or(eq(mediationInvitations.status, "pending_delivery"), eq(mediationInvitations.status, "delivered_inbox"))];
  if (allowClaim) conditions.push(isNull(mediationInvitations.recipientUserId));
  else conditions.push(eq(mediationInvitations.recipientUserId, userId));
  await db.update(mediationInvitations).set({ recipientUserId: userId, status: "opened", openedAt: new Date() }).where(and(...conditions));
  return getInvitationById(id);
}

export async function getInvitationById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(mediationInvitations).where(eq(mediationInvitations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function respondToInvitation(id: number, userId: number, response: "accepted" | "declined") {
  const db = await requireDb();
  const [result] = await db.update(mediationInvitations).set({ status: "responded", response, respondedAt: new Date(), recipientUserId: userId })
    .where(and(eq(mediationInvitations.id, id), eq(mediationInvitations.recipientUserId, userId), or(eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"))));
  return result.affectedRows > 0;
}

export async function expireInvitation(id: number) {
  const db = await requireDb();
  await db.update(mediationInvitations).set({ status: "expired" })
    .where(and(eq(mediationInvitations.id, id), lt(mediationInvitations.expiresAt, new Date()), or(eq(mediationInvitations.status, "pending_delivery"), eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"))));
}

export async function cancelInvitation(id: number, senderUserId: number) {
  const db = await requireDb();
  const [result] = await db.update(mediationInvitations).set({ status: "cancelled" })
    .where(and(eq(mediationInvitations.id, id), eq(mediationInvitations.senderUserId, senderUserId), or(eq(mediationInvitations.status, "pending_delivery"), eq(mediationInvitations.status, "delivered_inbox"), eq(mediationInvitations.status, "opened"))));
  return result.affectedRows > 0;
}
