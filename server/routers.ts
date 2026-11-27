import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createEmailAccount, getEmailCredential, upsertUser } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDummyPasswordHash, hashPassword, normalizeEmail, verifyPassword } from "./_core/password";
import { sdk, SESSION_LIFETIME_MS } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { casesRouter } from "./cases";
import { assistantRouter } from "./assistant";
import { invitationsRouter } from "./invitations";

const emailInput = z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا.").max(320).transform(normalizeEmail);
const passwordInput = z.string().min(12, "كلمة المرور يجب أن تتكون من 12 حرفًا على الأقل.").max(128, "كلمة المرور طويلة جدًا.");

function rejectCrossSiteAuth(ctx: { req: { headers: Record<string, string | string[] | undefined> } }) {
  const fetchSite = ctx.req.headers["sec-fetch-site"];
  if (typeof fetchSite === "string" && fetchSite.toLowerCase() === "cross-site") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cross-site authentication requests are not allowed." });
  }
}

async function setEmailSession(ctx: {
  req: Parameters<typeof getSessionCookieOptions>[0];
  res: { cookie(name: string, value: string, options: ReturnType<typeof getSessionCookieOptions> & { maxAge: number }): unknown };
}, openId: string, name: string | null) {
  const token = await sdk.createSessionToken(openId, { name: name ?? "", expiresInMs: SESSION_LIFETIME_MS });
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_LIFETIME_MS });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    emailRegister: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2, "اكتب اسمًا من حرفين على الأقل.").max(80, "الاسم طويل جدًا."),
        email: emailInput,
        password: passwordInput,
      }))
      .mutation(async ({ ctx, input }) => {
        rejectCrossSiteAuth(ctx);
        const passwordHash = await hashPassword(input.password);
        try {
          const user = await createEmailAccount({
            openId: `email_${crypto.randomUUID()}`,
            name: input.name,
            emailNormalized: input.email,
            passwordHash,
          });
          await setEmailSession(ctx, user.openId, user.name);
          return { success: true } as const;
        } catch (error) {
          if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
            throw new TRPCError({ code: "CONFLICT", message: "هذا البريد مرتبط بحساب موجود. سجّل الدخول أو استخدم طريقة الدخول السابقة لذلك الحساب." });
          }
          console.error("[Auth] Email registration failed", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر إنشاء الحساب الآن. حاول مرة أخرى لاحقًا." });
        }
      }),
    emailLogin: publicProcedure
      .input(z.object({ email: emailInput, password: passwordInput }))
      .mutation(async ({ ctx, input }) => {
        rejectCrossSiteAuth(ctx);
        try {
          const account = await getEmailCredential(input.email);
          const valid = await verifyPassword(input.password, account?.passwordHash ?? await getDummyPasswordHash());
          if (!account || !valid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
          }
          await upsertUser({ openId: account.user.openId, lastSignedIn: new Date() });
          await setEmailSession(ctx, account.user.openId, account.user.name);
          return { success: true } as const;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Auth] Email login failed", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر تسجيل الدخول الآن. حاول مرة أخرى لاحقًا." });
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  cases: casesRouter,
  assistant: assistantRouter,
  invitations: invitationsRouter,
});

export type AppRouter = typeof appRouter;
