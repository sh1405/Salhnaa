import { and, desc, eq } from "drizzle-orm";
import { mediationCases, type MediationCase } from "../drizzle/schema";
import { getDb } from "./db";

type CaseValues = Pick<MediationCase, "kind" | "country" | "safety" | "status" | "responses">;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

/** Include the owner in every predicate; never query by ID alone. */
export function ownedCase(userId: number, id: number) {
  return and(eq(mediationCases.userId, userId), eq(mediationCases.id, id));
}

export async function listCases(userId: number) {
  const db = await requireDb();
  return db.select().from(mediationCases)
    .where(eq(mediationCases.userId, userId))
    .orderBy(desc(mediationCases.updatedAt), desc(mediationCases.id));
}

export async function getCase(userId: number, id: number) {
  const db = await requireDb();
  const rows = await db.select().from(mediationCases).where(ownedCase(userId, id)).limit(1);
  return rows[0];
}

export async function createCase(userId: number, values: CaseValues) {
  const db = await requireDb();
  const rows = await db.insert(mediationCases).values({ ...values, userId }).$returningId();
  if (!rows[0]) throw new Error("Failed to create case");
  return rows[0].id;
}

export async function updateCase(userId: number, id: number, values: CaseValues) {
  const db = await requireDb();
  const [result] = await db.update(mediationCases).set(values).where(ownedCase(userId, id));
  // Drivers may report changed rather than matched rows; an unchanged owned row is still a success.
  return result.affectedRows > 0 || !!(await getCase(userId, id));
}

export async function deleteCase(userId: number, id: number) {
  const db = await requireDb();
  const [result] = await db.delete(mediationCases).where(ownedCase(userId, id));
  return result.affectedRows > 0;
}
