import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Optional number explicitly registered by the account owner for invitation matching. */
  phoneE164: varchar("phoneE164", { length: 16 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Private mediation files. A file is always owned by one authenticated user. */
export const mediationCases = mysqlTable("mediationCases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  kind: varchar("kind", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  safety: mysqlEnum("safety", ["safe", "danger", "unsure", "prefer_not"]).notNull(),
  status: mysqlEnum("status", ["draft", "paused"]).notNull(),
  responses: text("responses").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("mediation_cases_user_updated_idx").on(table.userId, table.updatedAt)]);

export type MediationCase = typeof mediationCases.$inferSelect;

/** Metadata-only invitation records. Case contents are never copied to the invitee. */
export const mediationInvitations = mysqlTable("mediationInvitations", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull().references(() => mediationCases.id, { onDelete: "cascade" }),
  senderUserId: int("senderUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientUserId: int("recipientUserId").references(() => users.id, { onDelete: "cascade" }),
  /** SHA-256 of a 256-bit random bearer code; the usable code is returned once. */
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending_delivery", "delivered_inbox", "opened", "responded", "cancelled", "expired"]).notNull(),
  response: mysqlEnum("response", ["accepted", "declined"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  openedAt: timestamp("openedAt"),
  respondedAt: timestamp("respondedAt"),
}, table => [
  index("mediation_invitations_sender_created_idx").on(table.senderUserId, table.createdAt),
  index("mediation_invitations_recipient_status_idx").on(table.recipientUserId, table.status),
  index("mediation_invitations_expires_idx").on(table.status, table.expiresAt),
]);

export type MediationInvitation = typeof mediationInvitations.$inferSelect;
