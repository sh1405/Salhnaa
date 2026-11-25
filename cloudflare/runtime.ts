import { AsyncLocalStorage } from "node:async_hooks";

export interface D1Result<T = Record<string, unknown>> {
  success: boolean;
  results: T[];
  meta?: { changes?: number; last_row_id?: number };
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(sql: string): D1Statement;
}

export interface WorkersAI {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface CloudflareBindings {
  DB: D1Database;
  AI: WorkersAI;
  ASSETS: { fetch(request: Request): Promise<Response> };
  MANUS_PROJECT_ID?: string;
  MANUS_OAUTH_PORTAL_URL?: string;
  MANUS_OAUTH_API_URL?: string;
  MANUS_API_URL?: string;
  MANUS_API_BROWSER_KEY?: string;
  SESSION_SECRET?: string;
}

const requestBindings = new AsyncLocalStorage<CloudflareBindings>();

export function withCloudflareBindings<T>(bindings: CloudflareBindings, work: () => T): T {
  return requestBindings.run(bindings, work);
}

export function getCloudflareBindings(): CloudflareBindings | undefined {
  return requestBindings.getStore();
}

export function getD1Database(): D1Database | undefined {
  return requestBindings.getStore()?.DB;
}

export function getWorkersAI(): WorkersAI | undefined {
  return requestBindings.getStore()?.AI;
}

export function getCloudflareEnvValue(name: string): string | undefined {
  const value = requestBindings.getStore()?.[name as keyof CloudflareBindings];
  return typeof value === "string" ? value : undefined;
}

export function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date value");
  return date.toISOString();
}

export function fromIso(value: unknown): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid stored date value");
  return date;
}
