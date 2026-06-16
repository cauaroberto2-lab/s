/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, Eye, HelpCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onSelect: (product: Product) => void;
  onAddToBagQuick: (product: Product) => void;
  isInBag: boolean;
}

export default function ProductCard({
  product,
  onSelect,
  onAddToBagQuick,
  isInBag,
}: ProductCardProps) {
  // Map category code to human readable label
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'tenis': return 'Tênis / Sneakers';
      case 'roupas': return 'Vestuário / Roupas';
      case 'acessorios': return 'Acessórios / Outros';
      default: return 'Streetwear';
    }
  };

  return (
    <article
      id={`product-card-${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-none border-2 border-black bg-white transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] duration-300 pointer-events-auto"
    >
      {/* Badge container: Por encomenda */}
      <span className="absolute left-3 top-3 z-10 rounded-none bg-[#FF3B30] px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-white border border-black shadow-xs">
        Por Encomenda
      </span>

      {/* Product Image Stage */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 border-b-2 border-black">
        <img
          src={product.images[0] || null}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 scale-100 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            const fallbackMap: {[key: string]: string} = {
              tenis: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
              roupas: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
              acessorios: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80'
            };
            e.currentTarget.src = fallbackMap[product.category] || fallbackMap.tenis;
          }}
        />

        {/* Action slide-up overlays */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            id={`view-details-${product.id}`}
            onClick={() => onSelect(product)}
            className="flex h-11 w-11 items-center justify-center rounded-none border-2 border-black bg-white text-black shadow-xs hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30] transition-colors active:scale-90 cursor-pointer"
            title="Ver Detalhes do Produto"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            id={`quick-add-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddToBagQuick(product);
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-none border-2 border-black shadow-xs transition-all active:scale-90 cursor-pointer ${
              isInBag
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white text-gray-800 hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30]'
            }`}
            title={isInBag ? "Adicionado à Lista" : "Adicionar rápido à lista"}
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Info details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-black text-gray-400 font-mono uppercase tracking-widest">
          <span>{product.brand} • {getCategoryLabel(product.category)}</span>
          <span className="rounded-none border border-black bg-[#F8F8F8] px-2 py-0.5 text-[9px] text-black font-mono font-bold uppercase">
            {product.subCategory}
          </span>
        </div>

        <h3 className="mt-2 font-display text-[15px] font-black uppercase leading-snug text-black group-hover:text-[#FF3B30] transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Availability status descriptor */}
        <div className="mt-4 p-3 bg-[#F8F8F8] border-l-4 border-[#FF3B30] text-left">
          <span className="block font-mono text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Disponibilidade</span>
          <p className="font-sans text-[11px] leading-relaxed text-gray-700 font-extrabold uppercase">
            Consultar com vendedor
          </p>
        </div>

        {/* Primary action trigger */}
        <div className="mt-auto pt-4">
          <button
            id={`btn-consultar-${product.id}`}
            onClick={() => onSelect(product)}
            className="flex w-full items-center justify-center gap-1.5 rounded-none border-2 border-black bg-black py-3 font-mono text-[11px] font-black tracking-wider text-white uppercase transition-all hover:bg-white hover:text-black hover:border-black group-hover:shadow-xs cursor-pointer"
          >
            Consultar disponibilidade
          </button>
        </div>
      </div>
    </article>
  );
}
