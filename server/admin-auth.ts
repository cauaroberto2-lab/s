import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

export interface AdminSession {
  adminId: string;
  expiresAt: number;
}

const SESSION_COOKIE = 'pais_store_admin_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const MAX_BODY_BYTES = 16 * 1024;

export function sendJson(response: ServerResponse, status: number, payload: unknown, headers: Record<string, string> = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.end(JSON.stringify(payload));
}

export async function readJsonBody(request: ApiRequest): Promise<unknown> {
  if (request.body !== undefined) return request.body;

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += value.length;
    if (totalBytes > MAX_BODY_BYTES) throw new Error('Corpo da requisição excede o limite permitido.');
    chunks.push(value);
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('JSON inválido.');
  }
}

function requiredEnvironment() {
  const writeToken = process.env.ADMIN_FEATURED_WRITE_TOKEN ?? '';
  const sessionSecret = process.env.ADMIN_FEATURED_SESSION_SECRET ?? '';
  if (writeToken.length < 32 || sessionSecret.length < 32) return null;
  return { writeToken, sessionSecret, adminId: process.env.ADMIN_FEATURED_ADMIN_ID?.trim() || 'admin' };
}

export function getAdminConfigurationError() {
  return requiredEnvironment() ? null : 'Configure ADMIN_FEATURED_WRITE_TOKEN e ADMIN_FEATURED_SESSION_SECRET com ao menos 32 caracteres.';
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function cookieValue(request: IncomingMessage, name: string) {
  const cookies = request.headers.cookie ?? '';
  const entry = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

export function createAdminSessionCookie() {
  const config = requiredEnvironment();
  if (!config) throw new Error('Autenticação administrativa não configurada.');

  const payload = Buffer.from(JSON.stringify({
    adminId: config.adminId,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1_000,
  })).toString('base64url');
  const value = `${payload}.${signature(payload, config.sessionSecret)}`;
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearAdminSessionCookie() {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function verifyAdminToken(token: unknown) {
  const config = requiredEnvironment();
  return Boolean(config && typeof token === 'string' && safeEqual(token, config.writeToken));
}

export function getAdminSession(request: IncomingMessage): AdminSession | null {
  const config = requiredEnvironment();
  const value = cookieValue(request, SESSION_COOKIE);
  if (!config || !value) return null;

  const [payload, receivedSignature] = value.split('.');
  if (!payload || !receivedSignature || !safeEqual(receivedSignature, signature(payload, config.sessionSecret))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
    return typeof session.adminId === 'string' && typeof session.expiresAt === 'number' && session.expiresAt > Date.now()
      ? session
      : null;
  } catch {
    return null;
  }
}

export function hasSameOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const configuredOrigin = process.env.APP_URL?.replace(/\/$/, '');
  if (configuredOrigin) return origin === configuredOrigin;

  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}
