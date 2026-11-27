import { parse as parseCookieHeader } from "cookie";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { COOKIE_NAME, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { appRouter } from "./routers";
import { sdk, SESSION_LIFETIME_MS } from "./_core/sdk";
import { publicPlatformScript } from "./_core/publicConfig";
import * as db from "./db";
import { withCloudflareBindings, type CloudflareBindings } from "../cloudflare/runtime";

interface WorkerEnv extends CloudflareBindings {
  DB: NonNullable<CloudflareBindings["DB"]>;
  AI: NonNullable<CloudflareBindings["AI"]>;
  ASSETS: NonNullable<CloudflareBindings["ASSETS"]>;
}

function secure(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(body: unknown, status = 200, headers = new Headers()): Response {
  headers.set("Content-Type", "application/json; charset=utf-8");
  return secure(new Response(JSON.stringify(body), { status, headers }));
}

function requestLike(request: Request): ExpressRequest {
  return {
    path: new URL(request.url).pathname,
    headers: Object.fromEntries(request.headers.entries()),
  } as unknown as ExpressRequest;
}

async function oauthCallback(request: Request, env: WorkerEnv): Promise<Response> {
  if (!env.MANUS_PROJECT_ID || !env.MANUS_OAUTH_API_URL || !env.MANUS_OAUTH_PORTAL_URL || !env.SESSION_SECRET) {
    return json({ error: "OAuth is not configured for this Worker" }, 503);
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return json({ error: "code and state are required" }, 400);

  const stateData = decodeOAuthState(state);
  const expectedNonce = parseCookieHeader(request.headers.get("cookie") ?? "")[OAUTH_STATE_COOKIE];
  if (!stateData.nonce || stateData.nonce !== expectedNonce) return json({ error: "invalid oauth state" }, 403);
  let redirectUri: URL;
  try { redirectUri = new URL(stateData.redirectUri); } catch { return json({ error: "invalid redirect uri" }, 400); }
  if (redirectUri.origin !== url.origin || redirectUri.pathname !== "/api/oauth/callback") {
    return json({ error: "invalid redirect uri" }, 400);
  }

  try {
    const token = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(token.accessToken);
    if (!userInfo.openId) return json({ error: "openId missing from user info" }, 400);
    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });
    const session = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: SESSION_LIFETIME_MS,
    });
    const safeReturnTo = stateData.returnTo ?? "";
    const returnTo = /^\/invite\/[A-Za-z0-9_-]{43}$/.test(safeReturnTo) || /^\/journey(?:\/[1-9][0-9]{0,9})?$/.test(safeReturnTo) ? safeReturnTo : "/";
    const headers = new Headers({ Location: new URL(returnTo, url.origin).toString() });
    headers.append("Set-Cookie", `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; Secure; SameSite=None`);
    headers.append("Set-Cookie", `${COOKIE_NAME}=${session}; Path=/; Max-Age=${Math.floor(SESSION_LIFETIME_MS / 1000)}; HttpOnly; Secure; SameSite=None`);
    return secure(new Response(null, { status: 302, headers }));
  } catch {
    // Do not log OAuth tokens, provider responses, or user data.
    return json({ error: "OAuth callback failed" }, 500);
  }
}

async function handle(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/health" && request.method === "GET") return json({ status: "ok" });
  if (url.pathname === "/api/platform/config.js" && request.method === "GET") {
    const config = publicPlatformScript({
      MANUS_PROJECT_ID: env.MANUS_PROJECT_ID ?? "",
      MANUS_OAUTH_PORTAL_URL: env.MANUS_OAUTH_PORTAL_URL ?? "",
      MANUS_API_URL: env.MANUS_API_URL ?? "",
      MANUS_API_BROWSER_KEY: env.MANUS_API_BROWSER_KEY ?? "",
    } as NodeJS.ProcessEnv);
    return secure(new Response(config, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } }));
  }
  if (url.pathname === "/api/oauth/callback" && request.method === "GET") return oauthCallback(request, env);
  if (url.pathname === "/api/trpc" || url.pathname.startsWith("/api/trpc/")) {
    if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") {
      return json({ error: "Cross-site API requests are not allowed." }, 403);
    }
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: async ({ req, resHeaders }) => {
        const reqCompat = requestLike(req);
        const resCompat = {
          clearCookie(name: string) {
            resHeaders.append("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`);
          },
        } as unknown as ExpressResponse;
        let user = null;
        try { user = await sdk.authenticateRequest(reqCompat); } catch { user = null; }
        return { req: reqCompat, res: resCompat, user };
      },
    });
    return secure(response);
  }
  const isClientRoute = request.method === "GET" && !/\.[^/]+$/.test(url.pathname);
  const assetRequest = isClientRoute
    ? new Request(new URL("/", url.origin), request)
    : request;
  return secure(await env.ASSETS.fetch(assetRequest));
}

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return withCloudflareBindings(env, () => handle(request, env));
  },
};
