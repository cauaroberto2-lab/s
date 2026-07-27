import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import adminSessionHandler from '../api/admin-session';
import featuredProductHandler from '../api/featured-product';
import type { ApiRequest } from '../api/admin-auth';

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const source = Buffer.concat(chunks).toString('utf8');
  return source ? JSON.parse(source) : {};
}

async function startServer(listener: (request: IncomingMessage, response: ServerResponse) => Promise<void>) {
  const server = createServer((request, response) => { void listener(request, response); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Não foi possível iniciar o servidor de teste.');
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function run() {
  const redisData = new Map<string, string>();
  let redisAvailable = true;
  const redis = await startServer(async (request, response) => {
    if (!redisAvailable) {
      response.statusCode = 503;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'temporary_unavailable' }));
      return;
    }
    if (request.headers.authorization !== 'Bearer test-redis-token') {
      response.statusCode = 401;
      response.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
    const [command, key, value] = await readBody(request) as string[];
    if (command === 'GET') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ result: redisData.get(key) ?? null }));
      return;
    }
    if (command === 'SET' && typeof value === 'string') {
      redisData.set(key, value);
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ result: 'OK' }));
      return;
    }
    response.statusCode = 400;
    response.end(JSON.stringify({ error: 'unsupported command' }));
  });

  process.env.UPSTASH_REDIS_REST_URL = redis.origin;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
  process.env.ADMIN_FEATURED_WRITE_TOKEN = 'test-write-token-that-is-long-enough-123456';
  process.env.ADMIN_FEATURED_SESSION_SECRET = 'test-session-secret-that-is-long-enough-123456';
  process.env.ADMIN_FEATURED_ADMIN_ID = 'test-admin';
  delete process.env.APP_URL;
  delete process.env.NODE_ENV;
  delete process.env.VERCEL;

  const api = await startServer(async (request, response) => {
    const apiRequest = request as ApiRequest;
    if (request.method === 'POST' || request.method === 'PUT') apiRequest.body = await readBody(request);
    if (request.url === '/api/admin-session') return adminSessionHandler(apiRequest, response);
    if (request.url === '/api/featured-product') return featuredProductHandler(apiRequest, response);
    response.statusCode = 404;
    response.end();
  });

  try {
    const initial = await fetch(`${api.origin}/api/featured-product`);
    assert.deepEqual(await initial.json(), { featuredProductId: null, updatedAt: null });

    const visitorSave = await fetch(`${api.origin}/api/featured-product`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: api.origin }, body: JSON.stringify({ featuredProductId: 'invalid' }),
    });
    assert.equal(visitorSave.status, 401, 'Um visitante não pode alterar o destaque.');

    const rejectedLogin = await fetch(`${api.origin}/api/admin-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'wrong' }),
    });
    assert.equal(rejectedLogin.status, 401);

    const login = await fetch(`${api.origin}/api/admin-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: process.env.ADMIN_FEATURED_WRITE_TOKEN }),
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie') ?? '';
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    const sessionCookie = setCookie.split(';')[0];
    assert.ok(sessionCookie, 'A autenticação deve criar um cookie HTTP-only.');

    const catalog = JSON.parse(await readFile('public/catalog.json', 'utf8')) as { products: Array<{ id: string; archived?: boolean }> };
    const product = catalog.products.find((item) => !item.archived && item.id !== 'dx-338379710');
    assert.ok(product, 'O catálogo de teste precisa ter um produto ativo diferente do tênis padrão.');

    const saved = await fetch(`${api.origin}/api/featured-product`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie, Origin: api.origin },
      body: JSON.stringify({ featuredProductId: product.id }),
    });
    assert.equal(saved.status, 200);
    const savedPayload = await saved.json() as { featuredProductId: string; updatedAt: string };
    assert.equal(savedPayload.featuredProductId, product.id);
    assert.ok(savedPayload.updatedAt);

    const crossOriginSave = await fetch(`${api.origin}/api/featured-product`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie, Origin: 'https://origem-maliciosa.example' },
      body: JSON.stringify({ featuredProductId: product.id }),
    });
    assert.equal(crossOriginSave.status, 403);

    const independentSession = await fetch(`${api.origin}/api/featured-product`);
    assert.equal(independentSession.status, 200);
    assert.equal((await independentSession.json() as { featuredProductId: string }).featuredProductId, product.id, 'Uma sessão sem cookie deve receber o mesmo destaque global.');

    const invalidProduct = await fetch(`${api.origin}/api/featured-product`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie, Origin: api.origin },
      body: JSON.stringify({ featuredProductId: 'not-in-current-catalog' }),
    });
    assert.equal(invalidProduct.status, 422);

    redisAvailable = false;
    const temporaryFailure = await fetch(`${api.origin}/api/featured-product`);
    assert.equal(temporaryFailure.status, 503, 'A indisponibilidade temporária do Redis deve ser reportada.');
    redisAvailable = true;

    const valueAfterFailure = await fetch(`${api.origin}/api/featured-product`);
    assert.equal((await valueAfterFailure.json() as { featuredProductId: string }).featuredProductId, product.id, 'Uma falha não pode sobrescrever o destaque salvo.');

    console.log('Featured product API: autenticação, Redis, falha temporária e persistência entre sessões passaram.');
  } finally {
    api.server.close();
    redis.server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
