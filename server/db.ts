import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users } from "../drizzle/schema";
import { fromIso, getCloudflareBindings, getD1Database, toIso } from "../cloudflare/runtime";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the existing MySQL connection only in the Manus runtime.
export async function getDb() {
  // Never fall through to the Manus database when a Worker binding is absent.
  if (getCloudflareBindings()) return null;
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function mapD1User(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    openId: String(row.openId),
    name: row.name == null ? null : String(row.name),
    email: row.email == null ? null : String(row.email),
    phoneE164: row.phoneE164 == null ? null : String(row.phoneE164),
    loginMethod: row.loginMethod == null ? null : String(row.loginMethod),
    role: row.role === "admin" ? "admin" : "user",
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
    lastSignedIn: fromIso(row.lastSignedIn),
  } as User;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const d1 = getD1Database();
  if (d1) {
    const values: InsertUser = { openId: user.openId };
    const updates: Record<string, string | number | null> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value !== undefined) {
        values[field] = value ?? null;
        updates[field] = value ?? null;
      }
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updates.lastSignedIn = toIso(user.lastSignedIn);
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updates.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updates.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updates).length === 0) updates.lastSignedIn = toIso(new Date());

    const columns = ["openId", ...Object.keys(values).filter(key => key !== "openId")];
    const placeholders = columns.map(() => "?").join(", ");
    const boundValues = columns.map(column => {
      const value = values[column as keyof InsertUser];
      return column === "lastSignedIn" ? toIso(value as Date | undefined) : value ?? null;
    });
    const updateSql = Object.keys(updates).map(column => `"${column}" = excluded."${column}"`).join(", ");
    await d1.prepare(`INSERT INTO users (${columns.map(column => `"${column}"`).join(", ")}) VALUES (${placeholders}) ON CONFLICT(openId) DO UPDATE SET ${updateSql}`)
      .bind(...boundValues)
      .run();
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const d1 = getD1Database();
  if (d1) {
    const row = await d1.prepare("SELECT * FROM users WHERE openId = ? LIMIT 1").bind(openId).first<Record<string, unknown>>();
    return row ? mapD1User(row) : undefined;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
