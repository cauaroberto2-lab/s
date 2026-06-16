/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'tenis' | 'roupas' | 'acessorios';
  subCategory: 'Masculino' | 'Feminino' | 'Unissex' | 'Infantil';
  images: string[]; // List of links
  description: string;
  sizes: string[]; // e.g., ['38', '39', '40', '41', '42']
  colors: string[]; // e.g., ['Preto', 'Branco/Preto', 'Cinzento']
  badge?: 'Lançamento' | 'Mais Pedido' | 'Coleção Premium' | 'Por Encomenda';
  isFeatured?: boolean;
}

export interface InterestItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface FilterState {
  category: string; // 'todos' | 'tenis' | 'roupas' | 'acessorios'
  subCategory: string; // 'todos' | 'Masculino' | 'Feminino' | 'Infantil'
  brand: string; // 'todos' or brand name
  search: string;
}
