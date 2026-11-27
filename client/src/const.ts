import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export function safeReturnPath(path: string): string {
  if (/^\/invite\/[A-Za-z0-9_-]{43}$/.test(path)) return path;
  if (/^\/journey(?:\/[1-9][0-9]{0,9})?$/.test(path)) return path;
  if (["/cases", "/invitations", "/assistant", "/dialogue"].includes(path)) return path;
  return "/journey";
}

export function loginHref(returnTo = "/journey"): string {
  const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/login?next=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

export function navigateToLogin(returnTo?: string): void {
  const currentPath = `${window.location.pathname}${window.location.search}`;
  window.location.assign(loginHref(returnTo ?? currentPath));
}

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = (returnTo = "/") => {
  const oauthPortalUrl = window.__MANUS_CONFIG__?.oauthPortalUrl;
  const appId = window.__MANUS_CONFIG__?.projectId;
  if (!oauthPortalUrl || !appId) throw new Error("Manus login is not configured");
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const safeReturnTo = safeReturnPath(returnTo);
  const state = encodeOAuthState({ redirectUri, nonce, returnTo: safeReturnTo });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("responseType", "code");

  window.location.href = url.toString();
};
