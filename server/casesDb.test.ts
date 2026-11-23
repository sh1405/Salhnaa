import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";

vi.mock("./db", () => ({ getDb: vi.fn() }));
import { getDb } from "./db";
import { createCase, deleteCase, getCase, listCases, updateCase } from "./casesDb";

const dialect = new MySqlDialect();
const values = { kind: "family", country: "SA", safety: "safe" as const, status: "draft" as const, responses: JSON.stringify({ facts: "خلاف حول ترتيبات الأسرة" }) };
function inspect(where: SQL) { return dialect.sqlToQuery(where); }
function assertOwned(where: SQL, userId: number, id: number) {
  const { sql, params } = inspect(where);
  expect(sql).toMatch(/`mediationCases`\.`userId`\s*=\s*\?/);
  expect(sql).toMatch(/`mediationCases`\.`id`\s*=\s*\?/);
  expect(sql.toLowerCase()).toContain(" and ");
  expect(params).toEqual([userId, id]);
}

beforeEach(() => { vi.resetAllMocks(); });

describe("case database ownership predicates", () => {
  it("filters list by session owner", async () => {
    const orderBy = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const fake = { select: () => ({ from: () => ({ where }) }) };
    vi.mocked(getDb).mockResolvedValue(fake as never);
    await listCases(12);
    const compiled = inspect(where.mock.calls[0][0]);
    expect(compiled.sql).toMatch(/`mediationCases`\.`userId`\s*=\s*\?/);
    expect(compiled.params).toEqual([12]);
  });

  it("includes both owner and id in reads", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const fake = { select: () => ({ from: () => ({ where }) }) };
    vi.mocked(getDb).mockResolvedValue(fake as never);
    await getCase(12, 34);
    assertOwned(where.mock.calls[0][0], 12, 34);
  });

  it("takes the insert owner exclusively from the server argument", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 71 }]);
    const insertValues = vi.fn().mockReturnValue({ $returningId: returning });
    const fake = { insert: () => ({ values: insertValues }) };
    vi.mocked(getDb).mockResolvedValue(fake as never);
    expect(await createCase(12, values)).toBe(71);
    expect(insertValues).toHaveBeenCalledWith({ ...values, userId: 12 });
  });

  it("includes both owner and id in atomic update and delete predicates", async () => {
    const updateWhere = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const deleteWhere = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const fake = { update: () => ({ set: () => ({ where: updateWhere }) }), delete: () => ({ where: deleteWhere }) };
    vi.mocked(getDb).mockResolvedValue(fake as never);
    expect(await updateCase(12, 34, values)).toBe(true);
    expect(await deleteCase(12, 34)).toBe(true);
    assertOwned(updateWhere.mock.calls[0][0], 12, 34);
    assertOwned(deleteWhere.mock.calls[0][0], 12, 34);
  });

  it("treats an unchanged owned row as a successful update, but a missing one as not found", async () => {
    const whereUpdate = vi.fn().mockResolvedValue([{ affectedRows: 0 }]);
    const limit = vi.fn().mockResolvedValueOnce([{ id: 34 }]).mockResolvedValueOnce([]);
    const whereSelect = vi.fn().mockReturnValue({ limit });
    const fake = { update: () => ({ set: () => ({ where: whereUpdate }) }), select: () => ({ from: () => ({ where: whereSelect }) }) };
    vi.mocked(getDb).mockResolvedValue(fake as never);
    expect(await updateCase(12, 34, values)).toBe(true);
    expect(await updateCase(12, 34, values)).toBe(false);
    assertOwned(whereUpdate.mock.calls[0][0], 12, 34);
    assertOwned(whereSelect.mock.calls[0][0], 12, 34);
  });

  it("fails instead of silently using an unavailable database", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(listCases(12)).rejects.toThrow("Database is not available");
  });
});
