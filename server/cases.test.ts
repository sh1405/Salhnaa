import { beforeEach, describe, expect, it, vi } from "vitest";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { MediationCase } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import type { AppRouter } from "./routers";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type _CreateResponsesContract = Assert<Equal<inferRouterInputs<AppRouter>["cases"]["create"]["responses"], Record<string, string>>>;
type _OutputResponsesContract = Assert<Equal<inferRouterOutputs<AppRouter>["cases"]["get"]["responses"], Record<string, string>>>;

// An in-memory repository exercises the real tRPC procedures without writing any
// test records to the shared project database. SQL scoping is tested separately.
const store = vi.hoisted(() => ({ rows: [] as MediationCase[], nextId: 1 }));
vi.mock("./casesDb", () => ({
  listCases: vi.fn(async (userId: number) => store.rows.filter(row => row.userId === userId)),
  getCase: vi.fn(async (userId: number, id: number) => store.rows.find(row => row.userId === userId && row.id === id)),
  createCase: vi.fn(async (userId: number, values: Omit<MediationCase, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const id = store.nextId++;
    store.rows.push({ ...values, id, userId, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }),
  updateCase: vi.fn(async (userId: number, id: number, values: Omit<MediationCase, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const row = store.rows.find(row => row.userId === userId && row.id === id);
    if (!row) return false;
    Object.assign(row, values);
    return true;
  }),
  deleteCase: vi.fn(async (userId: number, id: number) => {
    const index = store.rows.findIndex(row => row.userId === userId && row.id === id);
    if (index < 0) return false;
    store.rows.splice(index, 1);
    return true;
  }),
}));

import { appRouter } from "./routers";

function caller(userId: number | null) {
  const now = new Date();
  const user = userId === null ? null : {
    id: userId, openId: `user-${userId}`, name: null, email: null, loginMethod: null,
    role: "user" as const, createdAt: now, updatedAt: now, lastSignedIn: now,
  };
  return appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}
const base = { kind: "family" as const, country: "السعودية", safety: "safe" as const, responses: { facts: "خلاف حول مواعيد الزيارة" } };

beforeEach(() => { store.rows = []; store.nextId = 1; });

describe("cases protected procedures", () => {
  it("requires authentication for all five procedures", async () => {
    const api = caller(null).cases;
    const calls = [
      () => api.list(), () => api.get({ id: 1 }), () => api.create(base),
      () => api.update({ id: 1, ...base, status: "draft" }), () => api.delete({ id: 1 }),
    ];
    for (const call of calls) await expect(call()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates, lists, reads, updates, and deletes only the owner's files", async () => {
    const alice = caller(1).cases;
    const bob = caller(2).cases;
    const { id } = await alice.create(base);
    const bobFile = await bob.create({ ...base, country: "مصر" });
    expect(id).toBe(1);
    expect(await alice.list()).toHaveLength(1);
    expect(await bob.list()).toHaveLength(1);
    expect(await alice.get({ id })).toMatchObject({ id, userId: 1, status: "draft", responses: base.responses });
    expect((await alice.list())[0].responses).toEqual(base.responses);
    for (const call of [
      () => bob.get({ id }),
      () => bob.update({ id, ...base, status: "paused" }),
      () => bob.delete({ id }),
      () => alice.get({ id: 999 }),
    ]) await expect(call()).rejects.toMatchObject({ code: "NOT_FOUND" });
    const revisedResponses = { facts: "خلاف حول ترتيبات الزيارة الجديدة", answer: "جديد" };
    expect(await alice.update({ id, ...base, status: "paused", responses: revisedResponses })).toEqual({ success: true });
    expect(await alice.get({ id })).toMatchObject({ status: "paused", responses: revisedResponses });
    expect(await alice.delete({ id })).toEqual({ success: true });
    expect(await alice.list()).toEqual([]);
    expect(await bob.get({ id: bobFile.id })).toMatchObject({ country: "مصر" });
  });

  it("persists follow-up preferences as private user-authored responses, without creating a service request", async () => {
    const api = caller(1).cases;
    const preferences = ["writing_only", "human_mediation", "human_voice_optional"] as const;
    for (const followup_mode of preferences) {
      const { id } = await api.create({ ...base, responses: { ...base.responses, followup_mode } });
      expect((await api.get({ id })).responses.followup_mode).toBe(followup_mode);
    }
    expect(store.rows).toHaveLength(preferences.length);
    expect(store.rows.every(row => row.userId === 1)).toBe(true);
  });

  it("accepts exactly the journey kinds on create and update", async () => {
    const api = caller(1).cases;
    const kinds = ["individual", "family", "community", "business", "workplace", "organization", "multi", "international"] as const;
    const { id } = await api.create(base);
    for (const kind of kinds) {
      const created = await api.create({ ...base, kind });
      expect((await api.get({ id: created.id })).kind).toBe(kind);
      await expect(api.update({ id, ...base, kind, status: "draft" })).resolves.toEqual({ success: true });
      expect((await api.get({ id })).kind).toBe(kind);
    }
    for (const kind of ["عائلي", "other", "Family", " family ", "", " ", null, 1, undefined]) {
      await expect(api.create({ ...base, kind } as typeof base)).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.update({ id, ...base, kind, status: "draft" } as typeof base & { id: number; status: "draft" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect((await api.get({ id })).kind).toBe("international");
    }
    expect(store.rows).toHaveLength(kinds.length + 1);
  });

  it("requires non-empty textual facts for safe create and update", async () => {
    const api = caller(1).cases;
    const { id } = await api.create(base);
    for (const responses of [
      null, undefined, {}, { other: "تفاصيل فقط" }, { facts: "" }, { facts: " \t\n " }, { facts: "\u00a0" },
      { facts: null }, { facts: 42 }, { facts: false }, { facts: undefined },
    ]) {
      await expect(api.create({ ...base, responses } as typeof base)).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.update({ id, ...base, responses, status: "draft" } as typeof base & { id: number; status: "draft" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect((await api.get({ id })).responses).toEqual(base.responses);
    }
    await expect(api.update({ id, ...base, status: "draft", responses: { facts: "  وصف حقيقي للخلاف  " } })).resolves.toEqual({ success: true });
    expect((await api.get({ id })).responses.facts).toBe("  وصف حقيقي للخلاف  ");
    expect(store.rows).toHaveLength(1);
  });

  it("automatically pauses non-safe files and never stores their response details", async () => {
    const api = caller(1).cases;
    for (const safety of ["danger", "unsure", "prefer_not"] as const) {
      await expect(api.create({ ...base, safety })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.create({ ...base, safety, responses: { other: "" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      const { id } = await api.create({ ...base, safety, responses: {} });
      expect((await api.get({ id })).status).toBe("paused");
      await expect(api.update({ id, ...base, safety, responses: {}, status: "draft" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.update({ id, ...base, safety, status: "paused" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(api.update({ id, ...base, safety, responses: {}, status: "paused" })).resolves.toEqual({ success: true });
      expect((await api.get({ id })).responses).toEqual({});
      await expect(api.update({ id, ...base, responses: {}, status: "draft" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(await api.get({ id })).toMatchObject({ safety, status: "paused", responses: {} });
      await expect(api.update({ id, ...base, status: "draft" })).resolves.toEqual({ success: true });
      expect(await api.get({ id })).toMatchObject({ safety: "safe", status: "draft", responses: base.responses });
    }
    const { id } = await api.create(base);
    await expect(api.update({ id, ...base, status: "draft" })).resolves.toEqual({ success: true });
    await expect(api.update({ id, ...base, safety: "danger", status: "paused" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await api.get({ id })).responses).toEqual(base.responses);
    await expect(api.update({ id, ...base, safety: "danger", responses: {}, status: "paused" })).resolves.toEqual({ success: true });
    expect((await api.get({ id })).responses).toEqual({});
  });

  it("rejects owner spoofing, invalid fields, oversized responses, and reserved response keys", async () => {
    const api = caller(1).cases;
    const badInputs: unknown[] = [
      { ...base, userId: 2 }, { ...base, status: "draft" },
      { ...base, safety: "unknown" }, { ...base, kind: " " },
      { ...base, country: "a".repeat(101) }, { ...base, responses: { ...base.responses, answer: 42 } },
      { ...base, responses: { ...base.responses, ["x".repeat(101)]: "ok" } },
      { ...base, responses: { ...base.responses, x: "a".repeat(4001) } },
      { ...base, responses: { ...base.responses, ...Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`k${i}`, ""])) } },
      { ...base, responses: { ...base.responses, ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`k${i}`, "a".repeat(4000)])) } },
      { ...base, responses: { ...base.responses, ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, "م".repeat(3000)])) } },
      { ...base, responses: JSON.parse('{"facts":"خلاف","__proto__":"hidden"}') },
    ];
    for (const input of badInputs) await expect(api.create(input as typeof base)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(api.update({ ...base, id: 1, status: "draft", userId: 2 } as typeof base & { id: number; status: "draft" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    for (const id of [0, -1, 1.5, 2147483648]) {
      await expect(api.get({ id })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(store.rows).toHaveLength(0);
  });

  it("fails closed when persisted responses are malformed", async () => {
    const api = caller(1).cases;
    const { id } = await api.create(base);
    store.rows[0].responses = '["not", "a record"]';
    await expect(api.get({ id })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});
