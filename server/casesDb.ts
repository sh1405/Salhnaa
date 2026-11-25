import { and, desc, eq } from "drizzle-orm";
import { mediationCases, type MediationCase } from "../drizzle/schema";
import { fromIso, getD1Database, toIso } from "../cloudflare/runtime";
import { getDb } from "./db";

type CaseValues = Pick<MediationCase, "kind" | "country" | "safety" | "status" | "responses">;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

function mapD1Case(row: Record<string, unknown>): MediationCase {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    kind: String(row.kind),
    country: String(row.country),
    safety: String(row.safety) as MediationCase["safety"],
    status: String(row.status) as MediationCase["status"],
    responses: String(row.responses),
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

/** Include the owner in every predicate; never query by ID alone. */
export function ownedCase(userId: number, id: number) {
  return and(eq(mediationCases.userId, userId), eq(mediationCases.id, id));
}

export async function listCases(userId: number) {
  const d1 = getD1Database();
  if (d1) {
    const { results } = await d1.prepare("SELECT * FROM mediationCases WHERE userId = ? ORDER BY updatedAt DESC, id DESC").bind(userId).all<Record<string, unknown>>();
    return results.map(mapD1Case);
  }
  const db = await requireDb();
  return db.select().from(mediationCases)
    .where(eq(mediationCases.userId, userId))
    .orderBy(desc(mediationCases.updatedAt), desc(mediationCases.id));
}

export async function getCase(userId: number, id: number) {
  const d1 = getD1Database();
  if (d1) {
    const row = await d1.prepare("SELECT * FROM mediationCases WHERE userId = ? AND id = ? LIMIT 1").bind(userId, id).first<Record<string, unknown>>();
    return row ? mapD1Case(row) : undefined;
  }
  const db = await requireDb();
  const rows = await db.select().from(mediationCases).where(ownedCase(userId, id)).limit(1);
  return rows[0];
}

export async function createCase(userId: number, values: CaseValues) {
  const d1 = getD1Database();
  if (d1) {
    const now = toIso(new Date());
    const result = await d1.prepare("INSERT INTO mediationCases (userId, kind, country, safety, status, responses, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(userId, values.kind, values.country, values.safety, values.status, values.responses, now, now).run();
    const id = Number(result.meta?.last_row_id ?? 0);
    if (!id) throw new Error("Failed to create case");
    return id;
  }
  const db = await requireDb();
  const rows = await db.insert(mediationCases).values({ ...values, userId }).$returningId();
  if (!rows[0]) throw new Error("Failed to create case");
  return rows[0].id;
}

export async function updateCase(userId: number, id: number, values: CaseValues) {
  const d1 = getD1Database();
  if (d1) {
    const result = await d1.prepare("UPDATE mediationCases SET kind = ?, country = ?, safety = ?, status = ?, responses = ?, updatedAt = ? WHERE userId = ? AND id = ?")
      .bind(values.kind, values.country, values.safety, values.status, values.responses, toIso(new Date()), userId, id).run();
    return (result.meta?.changes ?? 0) > 0 || !!(await getCase(userId, id));
  }
  const db = await requireDb();
  const [result] = await db.update(mediationCases).set(values).where(ownedCase(userId, id));
  // Drivers may report changed rather than matched rows; an unchanged owned row is still a success.
  return result.affectedRows > 0 || !!(await getCase(userId, id));
}

export async function deleteCase(userId: number, id: number) {
  const d1 = getD1Database();
  if (d1) {
    const result = await d1.prepare("DELETE FROM mediationCases WHERE userId = ? AND id = ?").bind(userId, id).run();
    return (result.meta?.changes ?? 0) > 0;
  }
  const db = await requireDb();
  const [result] = await db.delete(mediationCases).where(ownedCase(userId, id));
  return result.affectedRows > 0;
}
