import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

const worker = vi.hoisted(() => ({ bindings: undefined as unknown, ai: undefined as unknown }));
vi.mock("../cloudflare/runtime", async importOriginal => ({
  ...await importOriginal<typeof import("../cloudflare/runtime")>(),
  getCloudflareBindings: () => worker.bindings,
  getWorkersAI: () => worker.ai,
}));
import { appRouter } from "./routers";

function caller(userId: number | null) {
  const now = new Date();
  const user = userId === null ? null : {
    id: userId, openId: `test-${userId}`, name: null, email: null, phoneE164: null, loginMethod: null,
    role: "user" as const, createdAt: now, updatedAt: now, lastSignedIn: now,
  };
  return appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}
const input = { text: "نختلف حول توزيع المهام في مشروع مشترك", consent: true as const };
const complete = () => ({ response: JSON.stringify({
  description: "ذكر صاحب الرواية وجود اختلاف في توزيع المهام.",
  interpretation: "لم يوضّح تفسيرًا إضافيًا.",
  possibilities: "قد يكون من المفيد توضيح المهام إذا كان ذلك مناسبًا.",
}) });
const run = vi.fn();
beforeEach(() => { run.mockReset().mockResolvedValue(complete()); worker.bindings = {}; worker.ai = { run }; });

describe("assistant opt-in and free-provider-only contract", () => {
  it("requires authentication and explicit consent", async () => {
    await expect(caller(null).assistant.organize(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller(701).assistant.organize({ ...input, consent: false } as unknown as typeof input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(run).not.toHaveBeenCalled();
  });
  it("rejects short and excessive text before sending to the model", async () => {
    await expect(caller(702).assistant.organize({ text: "قصير", consent: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller(702).assistant.organize({ text: "a".repeat(1501), consent: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(run).not.toHaveBeenCalled();
  });
  it("returns a cautious, reviewable draft using only the submitted text", async () => {
    const result = await caller(703).assistant.organize(input);
    expect(result.result).toContain("لم يتم التحقق");
    expect(result.result).toContain("ما وصفه صاحب الرواية");
    expect(result.result).toContain("أسئلة أو بدائل محتملة");
    expect(run).toHaveBeenCalledOnce();
    expect(run.mock.calls[0][1].messages[1]).toEqual({ role: "user", content: input.text });
  });
  it("rejects invalid output without exposing provider errors", async () => {
    run.mockResolvedValueOnce({ response: "غير صالح" });
    await expect(caller(704).assistant.organize(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر تنظيم النص الآن. يرجى المحاولة لاحقًا." });
  });
  it("uses the configured Workers AI model and validates structured output", async () => {
    run.mockResolvedValueOnce({ response: JSON.stringify({
      description: "رواية اختبارية من المستخدم.",
      interpretation: "التفسير كما ورد.",
      possibilities: "خيار أولي قابل للمراجعة.",
    }) });
    const result = await caller(710).assistant.organize(input);
    expect(result.result).toContain("رواية اختبارية من المستخدم");
    expect(run).toHaveBeenCalledOnce();
    expect(run.mock.calls[0][0]).toBe("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  });
  it("does not call Manus or another implicit provider when Workers AI is unavailable", async () => {
    worker.bindings = undefined;
    worker.ai = undefined;
    await expect(caller(711).assistant.organize(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(run).not.toHaveBeenCalled();
  });
  it("limits repeated use per account and permits a different account", async () => {
    for (let i = 0; i < 5; i++) await caller(705).assistant.organize(input);
    await expect(caller(705).assistant.organize(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(caller(706).assistant.organize(input)).resolves.toHaveProperty("result");
  });
});
