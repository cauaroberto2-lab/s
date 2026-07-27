import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ServerResponse } from 'node:http';
import {
  getAdminConfigurationError,
  getAdminSession,
  hasSameOrigin,
  readJsonBody,
  sendJson,
  type ApiRequest,
} from '../server/admin-auth';

export const FEATURED_PRODUCT_KEY = 'pais-store:featured-product:v1';

interface CatalogProduct {
  id: string;
  archived?: boolean;
  images?: unknown;
}

interface FeaturedProductRecord {
  featuredProductId: string;
  updatedAt: string;
  updatedBy?: string;
}

function redisConfiguration() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(command: Array<string>) {
  const configuration = redisConfiguration();
  if (!configuration) throw new Error('Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN na Vercel.');

  const response = await fetch(configuration.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${configuration.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const payload = await response.json() as { result?: unknown; error?: string };
  if (!response.ok || payload.error) throw new Error(payload.error ?? `Redis respondeu HTTP ${response.status}`);
  return payload.result;
}

function isFeaturedRecord(value: unknown): value is FeaturedProductRecord {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof (value as FeaturedProductRecord).featuredProductId === 'string'
    && typeof (value as FeaturedProductRecord).updatedAt === 'string',
  );
}

async function readFeaturedProduct() {
  const result = await redis(['GET', FEATURED_PRODUCT_KEY]);
  if (typeof result !== 'string') return null;
  try {
    const parsed = JSON.parse(result) as unknown;
    return isFeaturedRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readCatalogProducts() {
  const candidates = [
    path.join(process.cwd(), 'public', 'catalog.json'),
    path.join(process.cwd(), 'catalog.json'),
  ];
  let lastError: unknown;
  for (const filename of candidates) {
    try {
      const source = await readFile(filename, 'utf8');
      const catalog = JSON.parse(source) as { products?: unknown };
      if (Array.isArray(catalog.products)) return catalog.products as CatalogProduct[];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Catálogo não encontrado na função.');
}

function publicRecord(record: FeaturedProductRecord | null) {
  return record
    ? { featuredProductId: record.featuredProductId, updatedAt: record.updatedAt }
    : { featuredProductId: null, updatedAt: null };
}

export default async function handler(request: ApiRequest, response: ServerResponse) {
  if (request.method === 'GET') {
    try {
      sendJson(response, 200, publicRecord(await readFeaturedProduct()), { 'Cache-Control': 'no-store, max-age=0' });
    } catch (error) {
      sendJson(response, 503, { error: 'featured_storage_unavailable', message: error instanceof Error ? error.message : 'Destaque indisponível.' });
    }
    return;
  }

  if (request.method !== 'PUT') {
    response.setHeader('Allow', 'GET, PUT');
    sendJson(response, 405, { error: 'method_not_allowed' });
    return;
  }

  const configurationError = getAdminConfigurationError();
  if (configurationError) {
    sendJson(response, 503, { error: 'admin_not_configured', message: configurationError });
    return;
  }
  if (!hasSameOrigin(request)) {
    sendJson(response, 403, { error: 'invalid_origin' });
    return;
  }

  const session = getAdminSession(request);
  if (!session) {
    sendJson(response, 401, { error: 'unauthorized', message: 'Sessão administrativa obrigatória.' });
    return;
  }

  try {
    const body = await readJsonBody(request) as { featuredProductId?: unknown };
    const featuredProductId = typeof body?.featuredProductId === 'string' ? body.featuredProductId.trim() : '';
    if (!featuredProductId || featuredProductId.length > 180) {
      sendJson(response, 400, { error: 'invalid_product_id', message: 'Selecione um produto válido.' });
      return;
    }

    const products = await readCatalogProducts();
    const product = products.find((item) => item.id === featuredProductId && !item.archived);
    const hasImage = Array.isArray(product?.images) && product.images.some((image) => typeof image === 'string' && image.trim().length > 0);
    if (!product || !hasImage) {
      sendJson(response, 422, { error: 'product_not_in_catalog', message: 'O produto escolhido não existe mais no catálogo sincronizado ou não possui foto válida.' });
      return;
    }

    const record: FeaturedProductRecord = {
      featuredProductId,
      updatedAt: new Date().toISOString(),
      updatedBy: session.adminId,
    };
    await redis(['SET', FEATURED_PRODUCT_KEY, JSON.stringify(record)]);
    sendJson(response, 200, publicRecord(record));
  } catch (error) {
    sendJson(response, 503, { error: 'featured_save_failed', message: error instanceof Error ? error.message : 'Não foi possível salvar o destaque.' });
  }
}
