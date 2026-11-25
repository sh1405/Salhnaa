import { getCloudflareBindings, getCloudflareEnvValue } from "../../cloudflare/runtime";

// Platform values are read at use time. Worker bindings take precedence only while
// handling a Cloudflare request; the existing Manus runtime remains unchanged.
const value = (name: string) => getCloudflareEnvValue(name) ?? process.env[name] ?? "";

export const ENV = {
  get appId() { return value("MANUS_PROJECT_ID"); },
  get cookieSecret() { return getCloudflareBindings() ? getCloudflareEnvValue("SESSION_SECRET") ?? "" : process.env.MANUS_JWT_SECRET ?? ""; },
  get databaseUrl() { return value("DATABASE_URL"); },
  get oAuthServerUrl() { return value("MANUS_OAUTH_API_URL"); },
  // Preserve the legacy hint when supplied; otherwise roles remain application data.
  get ownerOpenId() { return value("OWNER_OPEN_ID"); },
  get isProduction() { return value("NODE_ENV") === "production"; },
  get forgeApiUrl() { return value("MANUS_API_URL"); },
  get forgeApiKey() { return value("MANUS_API_KEY"); },
};
