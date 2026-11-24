import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as invitationDb from "./invitationsDb";
import { decideInvitationRoute, isInvitationExpired, normalizePhoneNumber } from "./invitationLogic";

const idSchema = z.number().int().positive().max(2147483647);
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Invalid invitation code");
const hashToken = (code: string) => createHash("sha256").update(code, "utf8").digest("hex");

function notFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
}

async function loadActiveInvitation(code: string) {
  const invitation = await invitationDb.getInvitationByTokenHash(hashToken(code));
  if (!invitation) return null;
  if (isInvitationExpired(invitation.expiresAt) && !["responded", "cancelled", "expired"].includes(invitation.status)) {
    await invitationDb.expireInvitation(invitation.id);
    return { ...invitation, status: "expired" as const };
  }
  return invitation;
}

export const invitationsRouter = router({
  myPhone: protectedProcedure.query(async ({ ctx }) => ({ phone: await invitationDb.getPhoneForUser(ctx.user.id) })),

  savePhone: protectedProcedure.input(z.object({ phone: z.string().trim().max(40) }).strict()).mutation(async ({ ctx, input }) => {
    const phone = input.phone.trim() ? normalizePhoneNumber(input.phone) : null;
    if (input.phone.trim() && !phone) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid mobile number" });
    }
    try {
      await invitationDb.savePhoneForUser(ctx.user.id, phone);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
        throw new TRPCError({ code: "CONFLICT", message: "This number is already linked to another account" });
      }
      throw error;
    }
    return { saved: !!phone } as const;
  }),

  create: protectedProcedure.input(z.object({ caseId: idSchema, phone: z.string().trim().min(1).max(40) }).strict()).mutation(async ({ ctx, input }) => {
    const phone = normalizePhoneNumber(input.phone);
    if (!phone) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid mobile number" });
    const caseRow = await invitationDb.getOwnedSafeCase(ctx.user.id, input.caseId);
    if (!caseRow || caseRow.safety !== "safe" || caseRow.status !== "draft") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invitations can only be created from an active safe case" });
    }
    const matched = await invitationDb.findUserByPhone(phone);
    let status: "pending_delivery" | "delivered_inbox";
    try {
      status = decideInvitationRoute(matched?.id ?? null, ctx.user.id);
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot invite your own account" });
    }
    const code = randomBytes(32).toString("base64url");
    const id = await invitationDb.createInvitation({
      caseId: input.caseId,
      senderUserId: ctx.user.id,
      recipientUserId: matched?.id ?? null,
      tokenHash: hashToken(code),
      status,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    return { id, status, ...(status === "pending_delivery" ? { code } : {}) };
  }),

  inbox: protectedProcedure.query(async ({ ctx }) => invitationDb.listInbox(ctx.user.id)),
  sent: protectedProcedure.query(async ({ ctx }) => invitationDb.listSent(ctx.user.id)),

  preview: publicProcedure.input(z.object({ code: tokenSchema }).strict()).query(async ({ input }) => {
    const invite = await loadActiveInvitation(input.code);
    if (!invite) notFound();
    return {
      id: invite.id,
      status: invite.status,
      expiresAt: invite.expiresAt,
      senderName: invite.senderName ? "عضو في صالِحنا" : "عضو في صالِحنا",
      response: invite.response,
    };
  }),

  open: protectedProcedure.input(z.object({ id: idSchema.optional(), code: tokenSchema.optional() }).strict().refine(data => (data.id !== undefined) !== (data.code !== undefined), "Provide exactly one invitation reference")).mutation(async ({ ctx, input }) => {
    const invitation = input.code ? await loadActiveInvitation(input.code) : await invitationDb.getInvitationById(input.id!);
    if (!invitation || invitation.senderUserId === ctx.user.id) notFound();
    if (invitation.status === "expired" || invitation.status === "cancelled" || invitation.status === "responded") notFound();
    if (invitation.recipientUserId !== null && invitation.recipientUserId !== ctx.user.id) notFound();
    const opened = await invitationDb.claimAndOpenInvitation(invitation.id, ctx.user.id, invitation.recipientUserId === null);
    if (!opened || opened.recipientUserId !== ctx.user.id) notFound();
    return { opened: true, id: invitation.id } as const;
  }),

  respond: protectedProcedure.input(z.object({ id: idSchema, code: tokenSchema.optional(), response: z.enum(["accepted", "declined"]) }).strict()).mutation(async ({ ctx, input }) => {
    const invitation = input.code ? await loadActiveInvitation(input.code) : await invitationDb.getInvitationById(input.id);
    if (!invitation || invitation.id !== input.id || invitation.senderUserId === ctx.user.id) notFound();
    if (invitation.status === "expired" || invitation.status === "cancelled" || invitation.status === "responded") {
      throw new TRPCError({ code: "CONFLICT", message: "Invitation is no longer open" });
    }
    if (invitation.recipientUserId !== null && invitation.recipientUserId !== ctx.user.id) notFound();
    if (invitation.recipientUserId === null) {
      const opened = await invitationDb.claimAndOpenInvitation(invitation.id, ctx.user.id, true);
      if (!opened || opened.recipientUserId !== ctx.user.id) notFound();
    }
    const updated = await invitationDb.respondToInvitation(invitation.id, ctx.user.id, input.response);
    if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Invitation is no longer open" });
    return { status: "responded", response: input.response } as const;
  }),

  cancel: protectedProcedure.input(z.object({ id: idSchema }).strict()).mutation(async ({ ctx, input }) => {
    if (!(await invitationDb.cancelInvitation(input.id, ctx.user.id))) notFound();
    return { cancelled: true } as const;
  }),
});
