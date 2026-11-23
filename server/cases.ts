import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as casesDb from "./casesDb";
import type { MediationCase } from "../drizzle/schema";

// MySQL TEXT holds at most 65,535 bytes. Limit both individual fields and the
// serialized UTF-8 representation (including JSON escaping) before writing.
const responseRecordSchema = z.record(z.string().min(1).max(100), z.string().max(4000))
  .superRefine((responses, ctx) => {
    if (Object.keys(responses).length > 100) {
      ctx.addIssue({ code: "custom", message: "At most 100 responses are allowed" });
    }
    if (Buffer.byteLength(JSON.stringify(responses), "utf8") > 60000) {
      ctx.addIssue({ code: "custom", message: "Serialized responses must be at most 60000 bytes" });
    }
  });
// Zod's record parser drops __proto__; reject it explicitly instead of silently
// changing user data. The annotation preserves Record<string, string> input types.
const responsesSchema = z.preprocess((value: Record<string, string>, ctx) => {
  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "__proto__")) {
    ctx.addIssue({ code: "custom", message: "Reserved response key" });
  }
  return value;
}, responseRecordSchema);
const fields = {
  kind: z.enum(["individual", "family", "community", "business", "workplace", "organization", "multi", "international"]),
  country: z.string().trim().min(1).max(100),
  safety: z.enum(["safe", "danger", "unsure", "prefer_not"]),
  responses: responsesSchema,
};
const idSchema = z.number().int().positive().max(2147483647);
const emptyResponsesUnlessSafe = (data: { safety: string; responses: Record<string, string> }) =>
  data.safety === "safe" || Object.keys(data.responses).length === 0;
const factsRequiredWhenSafe = (data: { safety: string; responses: Record<string, string> }) =>
  data.safety !== "safe" || (Object.prototype.hasOwnProperty.call(data.responses, "facts") && data.responses.facts.trim().length > 0);
const createSchema = z.object(fields).strict().refine(emptyResponsesUnlessSafe, {
  path: ["responses"],
  message: "Cases that are not marked safe cannot contain responses",
}).refine(factsRequiredWhenSafe, {
  path: ["responses", "facts"],
  message: "Cases marked safe must contain non-empty facts",
});
const updateSchema = z.object({
  id: idSchema,
  ...fields,
  status: z.enum(["draft", "paused"]),
}).strict().refine(data => data.safety === "safe" || data.status === "paused", {
  path: ["status"],
  message: "Cases that are not marked safe must be paused",
}).refine(emptyResponsesUnlessSafe, {
  path: ["responses"],
  message: "Cases that are not marked safe cannot contain responses",
}).refine(factsRequiredWhenSafe, {
  path: ["responses", "facts"],
  message: "Cases marked safe must contain non-empty facts",
});

function toClient(row: MediationCase) {
  // Fail closed if persisted JSON is corrupt instead of returning an invalid shape.
  const parsed = responsesSchema.safeParse(JSON.parse(row.responses));
  if (!parsed.success) throw new Error("Invalid persisted case responses");
  return { ...row, responses: parsed.data };
}

function notFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
}

export const casesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) =>
    (await casesDb.listCases(ctx.user.id)).map(toClient)),
  get: protectedProcedure.input(z.object({ id: idSchema }).strict()).query(async ({ ctx, input }) => {
    const row = await casesDb.getCase(ctx.user.id, input.id);
    return row ? toClient(row) : notFound();
  }),
  create: protectedProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
    const { responses, ...fields } = input;
    const id = await casesDb.createCase(ctx.user.id, {
      ...fields,
      status: input.safety === "safe" ? "draft" : "paused",
      responses: JSON.stringify(responses),
    });
    return { id };
  }),
  update: protectedProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
    const { id, responses, ...fields } = input;
    const updated = await casesDb.updateCase(ctx.user.id, id, {
      ...fields,
      responses: JSON.stringify(responses),
    });
    if (!updated) notFound();
    return { success: true } as const;
  }),
  delete: protectedProcedure.input(z.object({ id: idSchema }).strict()).mutation(async ({ ctx, input }) => {
    if (!(await casesDb.deleteCase(ctx.user.id, input.id))) notFound();
    return { success: true } as const;
  }),
});
