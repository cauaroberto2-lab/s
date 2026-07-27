/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, ProductVariant } from '../types';
import { SAMPLE_PRODUCTS, BRANDS, CATEGORIES } from '../data';

const PRODUCTS_KEY = 'pais_store_catalog_products_v1';
const BRANDS_KEY = 'pais_store_catalog_brands_v1';
const CATEGORIES_KEY = 'pais_store_catalog_categories_v1';
const CONFIG_KEY = 'pais_store_catalog_config_v1';

export interface AdminProduct extends Omit<Product, 'sourceId' | 'slug' | 'variants' | 'totalStock' | 'available' | 'sourceUrl' | 'lastSyncedAt'> {
  sourceId?: string;
  slug?: string;
  variants?: ProductVariant[];
  totalStock?: number;
  available?: boolean;
  sourceUrl?: string;
  lastSyncedAt?: string;
  isActive: boolean; // Ativo / Inativo
  catalogueTab?: string; // e.g. 'lançamentos', 'mais-pedidos', 'sob-encomenda'
}

export interface AdminCategory {
  id: string;
  label: string;
}

export interface StoreConfig {
  whatsappPhone: string;
  instagramLink: string;
  assistantWelcomeMsg: string;
}

// Default dynamic categories
const DEFAULT_CATEGORIES: AdminCategory[] = [
  { id: 'todos', label: 'Todos os Produtos' },
  { id: 'tenis', label: 'Tênis' },
  { id: 'vestuario', label: 'Vestuário' },
  { id: 'jaquetas', label: 'Jaquetas' },
  { id: 'moletons', label: 'Moletons' },
  { id: 'camisetas', label: 'Camisetas' },
  { id: 'bones', label: 'Bonés' },
  { id: 'acessorios', label: 'Acessórios' }
];

// Default configurations
const DEFAULT_CONFIG: StoreConfig = {
  whatsappPhone: '5551985758791',
  instagramLink: 'https://www.instagram.com/paisstoreoficial',
  assistantWelcomeMsg: 'Olá! Estou no site da Pais Store Oficial e gostaria de tirar dúvidas sobre encomendas.'
};

/**
 * UTILITY: Compress image through canvas to keep base64 strings small in localStorage
 * AVISO: Isso é apenas temporário para demonstração, pois localStorage possui limite de ~5MB.
 */
export function compressImageBase64(file: File, maxWidth = 450, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar imagens.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao carregar arquivo.'));
    reader.readAsDataURL(file);
  });
}

// INIALIZATION: Seed localStorage if empty
export function initDatabase() {
  try {
    if (!localStorage.getItem(PRODUCTS_KEY)) {
      // Convert standard SAMPLE_PRODUCTS to AdminProduct
      const initialProducts: AdminProduct[] = SAMPLE_PRODUCTS.map(p => {
        // Map original category references
        let mappedCategory = p.category as string;
        if (p.category === 'roupas') {
          // refine based on name to match our expanded filters
          if (p.name.toLowerCase().includes('hoodie') || p.name.toLowerCase().includes('moletom')) {
            mappedCategory = 'moletons';
          } else if (p.name.toLowerCase().includes('puffer') || p.name.toLowerCase().includes('jaqueta')) {
            mappedCategory = 'jaquetas';
          } else if (p.name.toLowerCase().includes('tee') || p.name.toLowerCase().includes('camiseta')) {
            mappedCategory = 'camisetas';
          } else {
            mappedCategory = 'vestuario';
          }
        } else if (p.category === 'acessorios') {
          if (p.name.toLowerCase().includes('cap') || p.name.toLowerCase().includes('boné')) {
            mappedCategory = 'bones';
          } else {
            mappedCategory = 'acessorios';
          }
        }

        // Determine tabs
        let catalogueTab = 'todos';
        if (p.isFeatured) {
          catalogueTab = 'mais-pedidos';
        } else if (p.badge === 'Lançamento') {
          catalogueTab = 'lancamentos';
        } else if (p.badge === 'Por Encomenda' || !p.badge) {
          catalogueTab = 'sob-encomenda';
        }

        return {
          ...p,
          category: mappedCategory as any,
          isActive: true,
          catalogueTab
        };
      });
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
    }

    if (!localStorage.getItem(BRANDS_KEY)) {
      localStorage.setItem(BRANDS_KEY, JSON.stringify(BRANDS));
    }

    if (!localStorage.getItem(CATEGORIES_KEY)) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }

    if (!localStorage.getItem(CONFIG_KEY)) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    }
  } catch (error) {
    console.error('Falha ao inicializar o banco local localStorage:', error);
  }
}

// ----------------------------------------------------
// PRODUCT CRUD FUNCTIONS
// ----------------------------------------------------
export function getProducts(): AdminProduct[] {
  initDatabase();
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: AdminProduct[]) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Falha ao salvar produtos no localStorage:', e);
    alert('Erro de armazenamento! Se estiver usando uploads de imagens base64 grandes, você pode ter excedido o limite do navegador. Tente usar caminhos relativos de texto em vez disso.');
  }
}

export function addProduct(product: Omit<AdminProduct, 'id'>): AdminProduct {
  const products = getProducts();
  const newProduct: AdminProduct = {
    ...product,
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  };
  products.unshift(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updatedFields: Partial<AdminProduct>): AdminProduct | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const updatedProduct = {
    ...products[index],
    ...updatedFields
  };
  products[index] = updatedProduct;
  saveProducts(products);
  return updatedProduct;
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const initialLength = products.length;
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === initialLength) return false;
  saveProducts(filtered);
  return true;
}

// ----------------------------------------------------
// CATEGORY CRUD FUNCTIONS
// ----------------------------------------------------
export function getCategories(): AdminCategory[] {
  initDatabase();
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: AdminCategory[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function addCategory(label: string): AdminCategory {
  const categories = getCategories();
  const id = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
    
  const newCat: AdminCategory = { id, label };
  
  if (!categories.some(c => c.id === id)) {
    categories.push(newCat);
    saveCategories(categories);
  }
  return newCat;
}

export function deleteCategory(id: string): boolean {
  if (id === 'todos') return false; // Bloqueado
  const categories = getCategories();
  const filtered = categories.filter(c => c.id !== id);
  if (filtered.length === categories.length) return false;
  saveCategories(filtered);
  return true;
}

// ----------------------------------------------------
// BRAND CRUD FUNCTIONS
// ----------------------------------------------------
export function getBrands(): string[] {
  initDatabase();
  try {
    const data = localStorage.getItem(BRANDS_KEY);
    return data ? JSON.parse(data) : BRANDS;
  } catch {
    return BRANDS;
  }
}

export function saveBrands(brands: string[]) {
  localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
}

export function addBrand(name: string): string {
  const brands = getBrands();
  const trimmed = name.trim();
  if (trimmed && !brands.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
    brands.push(trimmed);
    saveBrands(brands);
  }
  return trimmed;
}

export function deleteBrand(name: string): boolean {
  const brands = getBrands();
  const filtered = brands.filter(b => b.toLowerCase() !== name.toLowerCase());
  if (filtered.length === brands.length) return false;
  saveBrands(filtered);
  return true;
}

// ----------------------------------------------------
// GENERAL STORE CONFIG
// ----------------------------------------------------
export function getStoreConfig(): StoreConfig {
  initDatabase();
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoreConfig(config: StoreConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
