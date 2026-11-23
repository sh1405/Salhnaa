import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

const model = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: model.invoke }));
import { appRouter } from "./routers";

function caller(userId: number | null) {
  const now = new Date();
  const user = userId === null ? null : {
    id: userId, openId: `test-${userId}`, name: null, email: null, loginMethod: null,
    role: "user" as const, createdAt: now, updatedAt: now, lastSignedIn: now,
  };
  return appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}
const input = { text: "نختلف حول توزيع المهام في مشروع مشترك", consent: true as const };
const complete = () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
  description: "ذكر صاحب الرواية وجود اختلاف في توزيع المهام.",
  interpretation: "لم يوضّح تفسيرًا إضافيًا.",
  possibilities: "قد يكون من المفيد توضيح المهام إذا كان ذلك مناسبًا.",
}) } }] });
beforeEach(() => { model.invoke.mockReset(); model.invoke.mockResolvedValue(complete()); });

describe("assistant opt-in and safety contract", () => {
  it("requires authentication and explicit consent", async () => {
    await expect(caller(null).assistant.organize(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller(701).assistant.organize({ ...input, consent: false } as unknown as typeof input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(model.invoke).not.toHaveBeenCalled();
  });
  it("rejects short and excessive text before sending to the model", async () => {
    await expect(caller(702).assistant.organize({ text: "قصير", consent: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller(702).assistant.organize({ text: "a".repeat(1501), consent: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(model.invoke).not.toHaveBeenCalled();
  });
  it("returns a cautious, reviewable draft using only the submitted text", async () => {
    const result = await caller(703).assistant.organize(input);
    expect(result.result).toContain("لم يتم التحقق");
    expect(result.result).toContain("ما وصفه صاحب الرواية");
    expect(result.result).toContain("أسئلة أو بدائل محتملة");
    expect(model.invoke).toHaveBeenCalledOnce();
    expect(model.invoke.mock.calls[0][0].messages[1]).toEqual({ role: "user", content: input.text });
  });
  it("rejects invalid output without exposing provider errors", async () => {
    model.invoke.mockResolvedValueOnce({ choices: [{ finish_reason: "stop", message: { content: "غير صالح" } }] });
    await expect(caller(704).assistant.organize(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر تنظيم النص الآن. يرجى المحاولة لاحقًا." });
  });
  it("limits repeated use per account and permits a different account", async () => {
    for (let i = 0; i < 5; i++) await caller(705).assistant.organize(input);
    await expect(caller(705).assistant.organize(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(caller(706).assistant.organize(input)).resolves.toHaveProperty("result");
  });
});
