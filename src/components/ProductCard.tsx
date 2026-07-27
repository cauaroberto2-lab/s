import React from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
import { FALLBACK_IMAGE } from '../data';
import type { Product } from '../types';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onSelect: (product: Product) => void;
  onAddToBagQuick: (product: Product) => void;
  isInBag: boolean;
}

export default function ProductCard({ product, onSelect, onAddToBagQuick, isInBag }: ProductCardProps) {
  const availabilityLabel = product.available
    ? `${product.totalStock} unidade${product.totalStock === 1 ? '' : 's'} disponível${product.totalStock === 1 ? '' : 'eis'}`
    : 'Produto esgotado';

  return (
    <article
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-none border-2 bg-white transition-all duration-300 ${
        product.available ? 'border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 opacity-75'
      }`}
    >
      <span className={`absolute left-3 top-3 z-10 border px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-white shadow-xs ${
        product.available ? 'border-black bg-[#FF3B30]' : 'border-gray-500 bg-gray-600'
      }`}>
        {product.available ? 'Por encomenda' : 'Esgotado'}
      </span>

      <div className="relative aspect-square overflow-hidden border-b-2 border-black bg-gray-50">
        <img
          src={product.images[0] || FALLBACK_IMAGE}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            if (event.currentTarget.src !== new URL(FALLBACK_IMAGE, window.location.origin).href) {
              event.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <button
            id={`view-details-${product.id}`}
            onClick={() => onSelect(product)}
            className="flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-black shadow-xs transition-colors hover:border-[#FF3B30] hover:bg-[#FF3B30] hover:text-white"
            aria-label={`Ver detalhes de ${product.name}`}
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            id={`quick-add-${product.id}`}
            onClick={() => onAddToBagQuick(product)}
            disabled={!product.available}
            className={`flex h-11 w-11 items-center justify-center border-2 border-black shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
              isInBag ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white text-gray-800 hover:border-[#FF3B30] hover:bg-[#FF3B30] hover:text-white'
            }`}
            aria-label={isInBag ? `${product.name} já está na lista` : `Adicionar ${product.name} à lista`}
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-[10px] font-black text-gray-400 font-mono uppercase tracking-widest">
          <span className="truncate">{product.brand} • {product.category}</span>
          <span className="shrink-0 border border-black bg-[#F8F8F8] px-2 py-0.5 text-[9px] text-black">{product.subCategory}</span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-display text-[15px] font-black uppercase leading-snug text-black transition-colors group-hover:text-[#FF3B30]">
          {product.name}
        </h3>

        <p className="mt-2 text-[10px] font-mono font-bold uppercase text-gray-500">Preço sob consulta</p>
        <div className={`mt-3 border-l-4 p-3 text-left ${product.available ? 'border-[#FF3B30] bg-[#F8F8F8]' : 'border-gray-500 bg-gray-100'}`}>
          <span className="block font-mono text-[9px] font-black uppercase tracking-wider text-gray-400">Disponibilidade</span>
          <p className="font-sans text-[11px] font-extrabold uppercase text-gray-700">{availabilityLabel}</p>
        </div>

        <div className="mt-auto pt-4">
          <button
            id={`btn-consultar-${product.id}`}
            onClick={() => onSelect(product)}
            className="flex w-full items-center justify-center gap-1.5 border-2 border-black bg-black py-3 font-mono text-[11px] font-black uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black"
          >
            {product.available ? 'Consultar pelo WhatsApp' : 'Ver disponibilidade'}
          </button>
        </div>
      </div>
    </article>
  );
}
