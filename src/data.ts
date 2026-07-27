import type { Product } from './types';

// Número já configurado pela Pais Store. A sincronização nunca o altera.
export const WHATSAPP_PHONE = '5551985758791';
export const INSTAGRAM_LINK = 'https://www.instagram.com/paisstoreoficial';
export const WHATSAPP_WELCOME_MSG = 'Olá! Gostaria de consultar a disponibilidade de um produto da Pais Store.';
export const FALLBACK_IMAGE = '/fallback-product.svg';

// O catálogo público é carregado de /catalog.json. O painel local legado
// começa vazio para nunca voltar a semear produtos fictícios no navegador.
export const SAMPLE_PRODUCTS: Product[] = [];
export const BRANDS: string[] = [];
export const CATEGORIES = [{ id: 'todos', label: 'Todos os Produtos' }];
export const SUBCATEGORIES = [{ id: 'todos', label: 'Todos' }];
