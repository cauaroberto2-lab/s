import { copyFile, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import type { CatalogData, Product, ProductVariant } from '../src/types';

const SOURCE_ORIGIN = 'https://dxstoreimports.com.br';
const CATALOG_URL = `${SOURCE_ORIGIN}/produtos/`;
const REQUEST_TIMEOUT_MS = 20_000;
const IMAGE_TIMEOUT_MS = 12_000;
const REQUEST_DELAY_MS = 220;
const IMAGE_REQUEST_DELAY_MS = 160;
const MAX_ATTEMPTS = 3;
const IMAGE_MAX_ATTEMPTS = 2;
const CONCURRENCY = 4;
const IMAGE_CONCURRENCY = 3;
const MIN_LISTING_COVERAGE = 0.9;
const MAX_MISSING_IMAGE_RATIO = 0.03;
const MAX_INVALID_IMAGE_RATIO = 0.12;
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'public', 'catalog.json');
const BACKUP_FILE = path.join(ROOT_DIR, 'public', 'catalog.previous.json');

type SourceVariant = {
  id?: string | number;
  product_id?: string | number;
  sku?: string | number | null;
  stock?: string | number | null;
  available?: boolean;
  is_visible?: boolean;
  option0?: string | null;
  option1?: string | null;
  option2?: string | null;
};

type Listing = {
  sourceId: string;
  sourceUrl: string;
  catalogPageUrl: string;
};

type PageMetric = {
  page: number;
  url: string;
  productsOnPage: number;
  newUniqueUrls: number;
  discoveredPageUrls: number;
};

type ImageCheck = {
  url: string;
  valid: boolean;
  reason?: string;
};

type ImageAudit = {
  products: Product[];
  totalImageUrls: number;
  validImageUrls: number;
  invalidImageUrls: number;
  productsWithValidImages: number;
  productsWithoutValidImages: Array<{ name: string; sourceUrl: string }>;
  invalidImages: Array<{ url: string; reason: string }>;
  duplicatePrimaryImages: Array<{ url: string; products: string[] }>;
  crossProductImageUses: number;
  sample: Array<{ catalogPage: number; name: string; sourceUrl: string; primaryImage: string }>;
};

type SyncReport = {
  status: 'updated' | 'unchanged' | 'validated' | 'failed';
  startedAt: string;
  pagesFound: number;
  pagesProcessed: number;
  pages: PageMetric[];
  reportedSupplierTotal: number | null;
  uniqueProductUrls: number;
  processedProducts: number;
  productErrorCount: number;
  productErrors: Array<{ sourceUrl: string; error: string }>;
  finalCatalogProducts: number;
  changedProducts: number;
  changed: boolean;
  imageAudit?: Omit<ImageAudit, 'products'>;
};

type Options = {
  dryRun: boolean;
  maxPages?: number;
  limit?: number;
};

class SyncFailure extends Error {
  constructor(message: string, readonly report: Partial<SyncReport>) {
    super(message);
    this.name = 'SyncFailure';
  }
}

function parseOptions(argv: string[]): Options {
  const value = (name: string) => {
    const argument = argv.find((item) => item.startsWith(`${name}=`));
    const parsed = argument ? Number(argument.slice(name.length + 1)) : undefined;
    return Number.isFinite(parsed) && parsed && parsed > 0 ? parsed : undefined;
  };

  return {
    dryRun: argv.includes('--dry-run'),
    maxPages: value('--max-pages'),
    limit: value('--limit'),
  };
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function toAbsoluteUrl(value: string | undefined) {
  if (!value || value.startsWith('data:')) return null;
  try {
    const url = new URL(value, SOURCE_ORIGIN);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96);
}

function pageNumber(url: string) {
  return Number(url.match(/\/page\/(\d+)/)?.[1] ?? 1);
}

function isBlockedPage(html: string) {
  // A página normal pode carregar scripts de CAPTCHA. Só recusamos desafios reais.
  return /verify you are human|access denied|unusual traffic|captcha challenge|<title[^>]*>[^<]*(?:captcha|blocked)/i.test(html);
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function fetchText(url: string) {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': 'PaisStoreCatalogSync/2.0 (+https://github.com/cauaroberto2-lab/s)',
          accept: 'text/html,application/xhtml+xml',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      if (isBlockedPage(html)) throw new Error('CAPTCHA ou bloqueio de acesso detectado');
      return html;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_ATTEMPTS) await sleep(REQUEST_DELAY_MS * attempt * 3);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Falha ao carregar ${url}: ${lastError?.message ?? 'erro desconhecido'}`);
}

function readStructuredProduct(html: string) {
  const $ = load(html);
  let product: Record<string, unknown> | null = null;

  $('script[type="application/ld+json"]').each((_, script) => {
    if (product) return;
    const json = parseJson<unknown>($(script).text(), null);
    for (const item of Array.isArray(json) ? json : [json]) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const candidate = record.mainEntity && typeof record.mainEntity === 'object'
        ? record.mainEntity as Record<string, unknown>
        : record;
      if (candidate['@type'] === 'Product') {
        product = candidate;
        return;
      }
    }
  });

  return product;
}

function getBreadcrumbs(html: string) {
  const $ = load(html);
  const breadcrumbs: string[] = [];

  $('script[type="application/ld+json"]').each((_, script) => {
    const json = parseJson<unknown>($(script).text(), null);
    for (const item of Array.isArray(json) ? json : [json]) {
      if (!item || typeof item !== 'object') continue;
      const breadcrumb = (item as Record<string, unknown>).breadcrumb as Record<string, unknown> | undefined;
      if (!Array.isArray(breadcrumb?.itemListElement)) continue;
      for (const entry of breadcrumb.itemListElement) {
        if (entry && typeof entry === 'object') {
          const name = cleanText((entry as Record<string, unknown>).name as string | undefined);
          if (name && !/^in[ií]cio$/i.test(name)) breadcrumbs.push(name);
        }
      }
    }
  });

  return unique(breadcrumbs);
}

const commercialText = /(?:r\$|pre[cç]o|parcel|atacado|promo[cç][aã]o|desconto|frete|whatsapp|pix|compre|garanta j[aá]|pagamento)/i;

function sanitizeDescriptionChunks(chunks: string[]) {
  return cleanText(chunks.filter((chunk) => chunk && !commercialText.test(chunk)).join(' ')).slice(0, 5_000);
}

function sanitizeDescription($: ReturnType<typeof load>, structuredDescription: string | undefined) {
  const chunks = $('[data-store^="product-description"] .user-content')
    .first()
    .find('h1,h2,h3,h4,h5,h6,p,li')
    .map((_, element) => cleanText($(element).text()))
    .get();
  const sanitized = sanitizeDescriptionChunks(chunks);
  if (sanitized) return sanitized;
  return sanitizeDescriptionChunks(cleanText(structuredDescription).split(/(?<=[.!?])\s+/));
}

function inferBrand(name: string, breadcrumbs: string[]) {
  const knownBrands = [
    'Nike', 'Adidas', 'New Balance', 'Vans', 'Puma', 'Mizuno', 'Asics', 'Jordan', 'Hocks',
    'Converse', 'Fila', 'Reebok', 'Lacoste', 'Tommy Hilfiger', 'Zara', 'Columbia',
    'The North Face', 'Oakley', 'Crocs', 'Champion', 'Under Armour',
  ];
  const value = `${breadcrumbs.join(' ')} ${name}`.toLocaleLowerCase('pt-BR');
  return knownBrands.find((brand) => value.includes(brand.toLocaleLowerCase('pt-BR'))) ?? 'Não informada';
}

function inferCategory(name: string, breadcrumbs: string[]) {
  const value = `${breadcrumbs.join(' ')} ${name}`.toLocaleLowerCase('pt-BR');
  if (/(moletom|camiseta|cal[cç]a|jaqueta|conjunto|blusa|short|vestido|bomber|puffer)/.test(value)) return 'Vestuário';
  if (/(bolsa|bon[eé]|[oó]culos|meia|carteira|mochila|acess[oó]rio)/.test(value)) return 'Acessórios';
  if (/(chinelo|slide|sand[aá]lia)/.test(value)) return 'Chinelos';
  return 'Tênis';
}

function readOptionLabels($: ReturnType<typeof load>) {
  return $('.js-product-variants-group').map((_, group) => cleanText($(group).find('label.form-label').first().text()).replace(/:.*/, '').toLocaleLowerCase('pt-BR')).get();
}

function optionAt(raw: SourceVariant, labels: string[], matcher: RegExp, fallbackIndex: number) {
  const index = labels.findIndex((label) => matcher.test(label));
  const options = [raw.option0, raw.option1, raw.option2].map((value) => cleanText(value));
  return options[index >= 0 ? index : fallbackIndex] ?? '';
}

function toVariants(rawVariants: SourceVariant[], labels: string[]): ProductVariant[] {
  const seen = new Set<string>();
  return rawVariants.map((raw, index) => {
    const stock = Math.max(0, Number(raw.stock ?? 0) || 0);
    const size = optionAt(raw, labels, /tamanho|numera[cç][aã]o/, 0) || 'Único';
    const color = optionAt(raw, labels, /cor|color/, 1) || 'Padrão';
    const id = String(raw.id ?? `${raw.product_id ?? 'variant'}-${index}`);
    return { id, size, color, stock, available: raw.available !== false && raw.is_visible !== false && stock > 0 };
  }).filter((variant) => {
    const key = `${variant.id}-${variant.size}-${variant.color}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => left.size.localeCompare(right.size, 'pt-BR', { numeric: true }));
}

function sourceFromSrcset(value: string | undefined) {
  if (!value || value.startsWith('data:')) return null;
  const candidates = value.split(',').map((entry) => {
    const [url, descriptor] = entry.trim().split(/\s+/);
    return { url, width: Number(descriptor?.replace(/\D/g, '') ?? 0) || 0 };
  }).filter((candidate) => candidate.url && !candidate.url.startsWith('data:'));
  return candidates.sort((left, right) => right.width - left.width)[0]?.url ?? null;
}

function isProductImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && /\/products\//i.test(url.pathname)
      && !/(?:logo|banner|placeholder|favicon|icon|theme)/i.test(url.pathname)
      && /\.(?:avif|gif|jpe?g|png|webp)(?:$|\?)/i.test(url.pathname + url.search);
  } catch {
    return false;
  }
}

function addImageCandidate(target: string[], value: string | undefined, fromSrcset = false) {
  const raw = fromSrcset ? sourceFromSrcset(value) : value;
  const url = toAbsoluteUrl(raw ?? undefined);
  if (url && isProductImageUrl(url)) target.push(url);
}

function imageIdentity(url: string) {
  const parsed = new URL(url);
  // A Nuvemshop publica a mesma foto em resoluções como -480-0 e -1024-1024.
  // A galeria deve manter uma única URL, preservando a primeira (a ampliada).
  return `${parsed.origin}${parsed.pathname.replace(/-\d{2,4}-(?:0|\d{2,4})(?=\.(?:avif|gif|jpe?g|png|webp)$)/i, '')}`;
}

function uniqueProductImages(candidates: string[]) {
  const identities = new Set<string>();
  return candidates.filter((url) => {
    const identity = imageIdentity(url);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
}

function extractImages($: ReturnType<typeof load>, structured: Record<string, unknown> | null) {
  const candidates: string[] = [];
  const gallery = $('.js-product-slide, a[data-fancybox="product-gallery"]');

  gallery.each((_, element) => {
    const scope = $(element);
    if (scope.is('a')) addImageCandidate(candidates, scope.attr('href'));
    addImageCandidate(candidates, scope.find('a[data-fancybox="product-gallery"], a.js-product-slide-link').first().attr('href'));
    scope.find('img, source').each((__, media) => {
      const image = $(media);
      addImageCandidate(candidates, image.attr('data-zoom-image'));
      addImageCandidate(candidates, image.attr('data-src'));
      addImageCandidate(candidates, image.attr('src'));
      addImageCandidate(candidates, image.attr('data-srcset'), true);
      addImageCandidate(candidates, image.attr('srcset'), true);
    });
  });

  // JSON-LD e og:image só são considerados se a galeria não estiver presente.
  if (candidates.length === 0) {
    const structuredImages = structured?.image;
    const values = Array.isArray(structuredImages) ? structuredImages : [structuredImages];
    for (const value of values) if (typeof value === 'string') addImageCandidate(candidates, value);
  }
  if (candidates.length === 0) addImageCandidate(candidates, $('meta[property="og:image"]').attr('content'));

  return uniqueProductImages(candidates);
}

function parseProduct(listing: Listing, html: string): Product {
  const $ = load(html);
  const root = $('#single-product');
  const rawVariants = parseJson<SourceVariant[]>(root.attr('data-variants'), []);
  const structured = readStructuredProduct(html);
  const breadcrumbs = getBreadcrumbs(html);
  const name = cleanText((structured?.name as string | undefined) ?? $('h1').first().text()) || listing.sourceId;
  const variants = toVariants(rawVariants, readOptionLabels($));
  const offers = structured?.offers as Record<string, unknown> | undefined;
  const availableFromSchema = typeof offers?.availability === 'string' && /InStock$/i.test(offers.availability);
  const sourceId = String(rawVariants[0]?.product_id ?? listing.sourceId);
  const sku = rawVariants.map((variant) => cleanText(String(variant.sku ?? ''))).find(Boolean);
  const subCategory = breadcrumbs.at(-2) ?? inferBrand(name, breadcrumbs);

  return {
    id: `dx-${sourceId}`,
    sourceId,
    slug: `${slugify(name)}-${sourceId}`,
    name,
    brand: inferBrand(name, breadcrumbs),
    category: inferCategory(name, breadcrumbs),
    subCategory,
    description: sanitizeDescription($, structured?.description as string | undefined),
    images: extractImages($, structured),
    variants,
    sizes: unique(variants.map((variant) => variant.size)),
    colors: unique(variants.map((variant) => variant.color).filter((color) => color !== 'Padrão')),
    totalStock: variants.reduce((total, variant) => total + variant.stock, 0),
    available: variants.length ? variants.some((variant) => variant.available) : availableFromSchema,
    archived: false,
    sourceUrl: listing.sourceUrl,
    lastSyncedAt: '',
    ...(sku ? { sku } : {}),
  };
}

function extractListings(html: string, catalogPageUrl: string) {
  const $ = load(html);
  const entries = new Map<string, Listing>();
  $('.js-item-product[data-product-id]').each((_, item) => {
    const sourceId = cleanText($(item).attr('data-product-id'));
    const sourceUrl = toAbsoluteUrl($(item).find('a.item-link').first().attr('href'));
    if (sourceId && sourceUrl) entries.set(sourceUrl, { sourceId, sourceUrl, catalogPageUrl });
  });
  return [...entries.values()];
}

function extractPageUrls(html: string) {
  const $ = load(html);
  const pages = new Set<string>();
  $('a[href]').each((_, anchor) => {
    const url = toAbsoluteUrl($(anchor).attr('href'));
    if (url && /^https:\/\/dxstoreimports\.com\.br\/produtos\/(?:page\/\d+\/?)?(?:\?[^#]*)?$/i.test(url)) pages.add(url);
  });
  return [...pages].sort((left, right) => pageNumber(left) - pageNumber(right));
}

function reportedProductTotal(html: string) {
  const text = cleanText(load(html)('body').text());
  const totals = [...text.matchAll(/(\d{1,4}(?:[.\s]\d{3})*)\s+produtos?/gi)]
    .map((match) => Number(match[1].replace(/[^0-9]/g, '')))
    .filter(Number.isFinite);
  return totals.length ? Math.max(...totals) : null;
}

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...data }));
}

async function collectListings(options: Options) {
  const pending = [CATALOG_URL];
  const queued = new Set(pending);
  const visited = new Set<string>();
  const listings = new Map<string, Listing>();
  const metrics: PageMetric[] = [];
  let supplierTotal: number | null = null;

  while (pending.length > 0) {
    if (options.maxPages && visited.size >= options.maxPages) break;
    const url = pending.shift()!;
    if (visited.has(url)) continue;
    await sleep(REQUEST_DELAY_MS);
    const html = await fetchText(url);
    visited.add(url);
    const listed = extractListings(html, url);
    const before = listings.size;
    for (const listing of listed) {
      if (!listings.has(listing.sourceUrl)) listings.set(listing.sourceUrl, listing);
    }
    const pages = extractPageUrls(html);
    for (const page of pages) {
      if (!visited.has(page) && !queued.has(page)) {
        queued.add(page);
        pending.push(page);
      }
    }
    const reported = reportedProductTotal(html);
    supplierTotal = Math.max(supplierTotal ?? 0, reported ?? 0) || null;
    const metric: PageMetric = {
      page: pageNumber(url),
      url,
      productsOnPage: listed.length,
      newUniqueUrls: listings.size - before,
      discoveredPageUrls: pages.length,
    };
    metrics.push(metric);
    log('catalog_page', metric);
  }

  if (listings.size === 0) throw new SyncFailure('Nenhum produto foi encontrado no catálogo da DX Store.', {
    pagesFound: queued.size,
    pagesProcessed: visited.size,
    pages: metrics,
    reportedSupplierTotal: supplierTotal,
    uniqueProductUrls: 0,
  });
  if (!options.maxPages && supplierTotal && listings.size < Math.ceil(supplierTotal * MIN_LISTING_COVERAGE)) {
    throw new SyncFailure(`Coleta inválida: ${listings.size} URLs únicas para ${supplierTotal} produtos informados pelo fornecedor.`, {
      pagesFound: queued.size,
      pagesProcessed: visited.size,
      pages: metrics,
      reportedSupplierTotal: supplierTotal,
      uniqueProductUrls: listings.size,
    });
  }

  return { listings: [...listings.values()], metrics, supplierTotal, pagesFound: queued.size };
}

async function mapSettled<T, R>(values: T[], concurrency: number, delay: number, mapper: (value: T) => Promise<R>) {
  const results = new Array<R | undefined>(values.length);
  const errors: Array<{ index: number; error: string }> = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      await sleep(delay);
      try {
        results[index] = await mapper(values[index]);
      } catch (error) {
        errors.push({ index, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return { results, errors };
}

async function validateImage(url: string): Promise<ImageCheck> {
  let lastReason = 'resposta inválida';

  for (let attempt = 1; attempt <= IMAGE_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    try {
      let response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'user-agent': 'PaisStoreCatalogSync/2.0', accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
      });
      let contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !/^image\//i.test(contentType)) {
        response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { range: 'bytes=0-0', 'user-agent': 'PaisStoreCatalogSync/2.0', accept: 'image/*' },
        });
        contentType = response.headers.get('content-type') ?? '';
        await response.body?.cancel();
      }
      if (response.ok && /^image\//i.test(contentType)) return { url, valid: true };
      lastReason = `HTTP ${response.status}, content-type ${contentType || 'ausente'}`;
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < IMAGE_MAX_ATTEMPTS) await sleep(IMAGE_REQUEST_DELAY_MS * attempt * 2);
  }

  return { url, valid: false, reason: lastReason };
}

function makeImageSample(products: Product[], listings: Listing[]) {
  const pageByUrl = new Map(listings.map((listing) => [listing.sourceUrl, pageNumber(listing.catalogPageUrl)]));
  const byPage = new Map<number, Product[]>();
  for (const product of products) {
    const page = pageByUrl.get(product.sourceUrl) ?? 0;
    const list = byPage.get(page) ?? [];
    list.push(product);
    byPage.set(page, list);
  }
  const sample: Array<{ catalogPage: number; name: string; sourceUrl: string; primaryImage: string }> = [];
  const pages = [...byPage.keys()].sort((left, right) => left - right);
  let offset = 0;
  while (sample.length < 20) {
    let added = false;
    for (const page of pages) {
      const product = byPage.get(page)?.[offset];
      if (!product) continue;
      sample.push({ catalogPage: page, name: product.name, sourceUrl: product.sourceUrl, primaryImage: product.images[0] ?? '' });
      added = true;
      if (sample.length === 20) break;
    }
    if (!added) break;
    offset += 1;
  }
  return sample;
}

async function auditImages(products: Product[], listings: Listing[]): Promise<ImageAudit> {
  const owners = new Map<string, string[]>();
  for (const product of products) {
    for (const image of product.images) owners.set(image, [...(owners.get(image) ?? []), product.sourceId]);
  }
  const urls = [...owners.keys()];
  const checked = await mapSettled(urls, IMAGE_CONCURRENCY, IMAGE_REQUEST_DELAY_MS, validateImage);
  const checks = new Map<string, ImageCheck>();
  for (const result of checked.results) if (result) checks.set(result.url, result);
  for (const error of checked.errors) checks.set(urls[error.index], { url: urls[error.index], valid: false, reason: error.error });
  const valid = new Set([...checks.values()].filter((check) => check.valid).map((check) => check.url));
  const invalidImages = [...checks.values()].filter((check) => !check.valid).map((check) => ({ url: check.url, reason: check.reason ?? 'imagem inválida' }));
  const normalizedProducts = products.map((product) => ({ ...product, images: product.images.filter((image) => valid.has(image)) }));
  const productsWithoutValidImages = normalizedProducts.filter((product) => product.images.length === 0).map((product) => ({ name: product.name, sourceUrl: product.sourceUrl }));
  const primaryGroups = new Map<string, string[]>();
  for (const product of normalizedProducts) {
    const primary = product.images[0];
    if (primary) primaryGroups.set(primary, [...(primaryGroups.get(primary) ?? []), product.name]);
  }
  const duplicatePrimaryImages = [...primaryGroups.entries()]
    .filter(([, names]) => names.length > 3)
    .map(([url, names]) => ({ url, products: names }));
  const crossProductImageUses = [...owners.values()].filter((productIds) => new Set(productIds).size > 1).length;

  return {
    products: normalizedProducts,
    totalImageUrls: urls.length,
    validImageUrls: valid.size,
    invalidImageUrls: invalidImages.length,
    productsWithValidImages: normalizedProducts.length - productsWithoutValidImages.length,
    productsWithoutValidImages,
    invalidImages: invalidImages.slice(0, 100),
    duplicatePrimaryImages,
    crossProductImageUses,
    sample: makeImageSample(normalizedProducts, listings),
  };
}

async function readCurrentCatalog(): Promise<CatalogData> {
  try {
    const content = await readFile(OUTPUT_FILE, 'utf8');
    const data = JSON.parse(content) as CatalogData;
    return data.schemaVersion === 1 && Array.isArray(data.products) ? data : { schemaVersion: 1, products: [] };
  } catch {
    return { schemaVersion: 1, products: [] };
  }
}

function isRealSourceProduct(product: Product) {
  try {
    const url = new URL(product.sourceUrl);
    return url.hostname === 'dxstoreimports.com.br' && /^\/produtos\//.test(url.pathname);
  } catch {
    return false;
  }
}

function withoutSyncDate(product: Product) {
  const { lastSyncedAt: _lastSyncedAt, ...rest } = product;
  return {
    ...rest,
    variants: [...rest.variants].sort((left, right) => left.id.localeCompare(right.id)),
    sizes: [...rest.sizes].sort((left, right) => left.localeCompare(right, 'pt-BR', { numeric: true })),
    colors: [...rest.colors].sort((left, right) => left.localeCompare(right, 'pt-BR')),
  };
}

function serialise(data: CatalogData) {
  const products = [...data.products].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')).map((product) => ({
    ...product,
    images: [...product.images],
    variants: [...product.variants].sort((left, right) => left.id.localeCompare(right.id)),
    sizes: [...product.sizes],
    colors: [...product.colors],
  }));
  return `${JSON.stringify({ schemaVersion: 1, products }, null, 2)}\n`;
}

async function writeCatalogAtomically(data: CatalogData) {
  const temporary = `${OUTPUT_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, serialise(data), 'utf8');
  try {
    await copyFile(OUTPUT_FILE, BACKUP_FILE);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      await rm(temporary, { force: true });
      throw error;
    }
  }
  try {
    await rename(temporary, OUTPUT_FILE);
  } finally {
    await rm(temporary, { force: true });
  }
}

function imageReport(audit: ImageAudit): Omit<ImageAudit, 'products'> {
  const { products: _products, ...report } = audit;
  return report;
}

async function run() {
  const options = parseOptions(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const current = await readCurrentCatalog();
  const listingResult = await collectListings(options);
  const listings = options.limit ? listingResult.listings.slice(0, options.limit) : listingResult.listings;
  const partialRun = Boolean(options.maxPages || options.limit);
  const baseReport: Partial<SyncReport> = {
    startedAt,
    pagesFound: listingResult.pagesFound,
    pagesProcessed: listingResult.metrics.length,
    pages: listingResult.metrics,
    reportedSupplierTotal: listingResult.supplierTotal,
    uniqueProductUrls: listingResult.listings.length,
    processedProducts: 0,
    productErrorCount: 0,
    productErrors: [],
    finalCatalogProducts: 0,
    changedProducts: 0,
    changed: false,
  };

  const details = await mapSettled(listings, CONCURRENCY, REQUEST_DELAY_MS, async (listing) => parseProduct(listing, await fetchText(listing.sourceUrl)));
  const productErrors = details.errors.map((error) => ({ sourceUrl: listings[error.index].sourceUrl, error: error.error }));
  if (productErrors.length > 0) {
    throw new SyncFailure('Coleta de páginas individuais incompleta; o catálogo anterior foi preservado.', {
      ...baseReport,
      processedProducts: details.results.filter(Boolean).length,
      productErrorCount: productErrors.length,
      productErrors,
    });
  }
  const collected = details.results.filter((product): product is Product => Boolean(product));
  if (collected.length !== listings.length || collected.some((product) => !product.name || !product.sourceId)) {
    throw new SyncFailure('Coleta de produtos inválida; o catálogo anterior foi preservado.', {
      ...baseReport,
      processedProducts: collected.length,
    });
  }

  const audit = await auditImages(collected, listings);
  const missingImageRatio = audit.productsWithoutValidImages.length / collected.length;
  const invalidImageRatio = audit.totalImageUrls ? audit.invalidImageUrls / audit.totalImageUrls : 1;
  if (audit.duplicatePrimaryImages.length > 0 || missingImageRatio > MAX_MISSING_IMAGE_RATIO || invalidImageRatio > MAX_INVALID_IMAGE_RATIO) {
    throw new SyncFailure('Validação de imagens reprovada; o catálogo anterior foi preservado.', {
      ...baseReport,
      processedProducts: collected.length,
      imageAudit: imageReport(audit),
    });
  }
  log('image_audit', {
    totalImageUrls: audit.totalImageUrls,
    validImageUrls: audit.validImageUrls,
    invalidImageUrls: audit.invalidImageUrls,
    productsWithValidImages: audit.productsWithValidImages,
    crossProductImageUses: audit.crossProductImageUses,
    sampleSize: audit.sample.length,
  });

  const previousBySourceId = new Map(current.products.map((product) => [product.sourceId, product]));
  const seen = new Set(audit.products.map((product) => product.sourceId));
  let changedProducts = 0;
  const synchronized = audit.products.map((product) => {
    const previous = previousBySourceId.get(product.sourceId);
    const unchanged = previous && JSON.stringify(withoutSyncDate(previous)) === JSON.stringify(withoutSyncDate(product));
    if (!unchanged) changedProducts += 1;
    return { ...product, lastSyncedAt: unchanged ? previous.lastSyncedAt : startedAt };
  });

  if (!partialRun) {
    for (const previous of current.products) {
      if (seen.has(previous.sourceId) || !isRealSourceProduct(previous)) continue;
      synchronized.push(previous.archived ? previous : {
        ...previous,
        variants: previous.variants.map((variant) => ({ ...variant, available: false, stock: 0 })),
        totalStock: 0,
        available: false,
        archived: true,
        lastSyncedAt: startedAt,
      });
    }
  }

  const next: CatalogData = partialRun ? current : { schemaVersion: 1, products: synchronized };
  const changed = !partialRun && serialise(current) !== serialise(next);
  if (changed && !options.dryRun) await writeCatalogAtomically(next);

  const report: SyncReport = {
    status: options.dryRun ? 'validated' : changed ? 'updated' : 'unchanged',
    ...baseReport,
    startedAt,
    pagesFound: listingResult.pagesFound,
    pagesProcessed: listingResult.metrics.length,
    pages: listingResult.metrics,
    reportedSupplierTotal: listingResult.supplierTotal,
    uniqueProductUrls: listingResult.listings.length,
    processedProducts: collected.length,
    productErrorCount: 0,
    productErrors: [],
    finalCatalogProducts: partialRun ? current.products.length : next.products.length,
    changedProducts,
    changed,
    imageAudit: imageReport(audit),
  };
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  const failure = error instanceof SyncFailure ? error : null;
  console.error(JSON.stringify({
    status: 'failed',
    at: new Date().toISOString(),
    errors: [error instanceof Error ? error.message : String(error)],
    ...failure?.report,
  }, null, 2));
  process.exitCode = 1;
});
