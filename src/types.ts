/** A variante é a menor unidade de disponibilidade mostrada no catálogo. */
export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  available: boolean;
}

/**
 * Dados públicos normalizados pela sincronização. Não existe campo de preço
 * nesta estrutura: a Pais Store atende valores exclusivamente pelo WhatsApp.
 */
export interface Product {
  id: string;
  sourceId: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  description: string;
  images: string[];
  variants: ProductVariant[];
  sizes: string[];
  colors: string[];
  totalStock: number;
  available: boolean;
  archived?: boolean;
  sourceUrl: string;
  lastSyncedAt: string;
  sku?: string;
  badge?: 'Lançamento' | 'Mais Pedido' | 'Coleção Premium' | 'Por Encomenda';
  isFeatured?: boolean;
}

export interface CatalogData {
  schemaVersion: 1;
  products: Product[];
}

export interface InterestItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface FilterState {
  category: string;
  brand: string;
  size: string;
  search: string;
}
