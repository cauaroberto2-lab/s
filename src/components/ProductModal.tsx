import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { FALLBACK_IMAGE } from '../data';
import type { InterestItem, Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (item: InterestItem) => void;
  isInBag: boolean;
  whatsappPhone: string;
}

export default function ProductModal({ product, onClose, onAddToBag, isInBag, whatsappPhone }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('A confirmar');
  const [activeImage, setActiveImage] = useState(FALLBACK_IMAGE);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (!product) return;
    const firstAvailable = product.variants.find((variant) => variant.available);
    setSelectedSize(firstAvailable?.size ?? product.sizes[0] ?? '');
    setSelectedColor(firstAvailable?.color && firstAvailable.color !== 'Padrão' ? firstAvailable.color : 'A confirmar');
    setActiveImage(product.images[0] || FALLBACK_IMAGE);
    setAddedSuccess(false);
  }, [product]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const sizes = useMemo(() => product ? [...new Set(product.sizes)] : [], [product]);
  const colors = useMemo(() => product ? [...new Set(product.colors)] : [], [product]);

  if (!product) return null;

  const sizeIsAvailable = (size: string) => product.variants.some((variant) => variant.size === size && variant.available);
  const colorIsAvailable = (color: string) => product.variants.some((variant) => (
    variant.available
    && variant.color === color
    && (!selectedSize || variant.size === selectedSize)
  ));

  const chooseSize = (size: string) => {
    if (!sizeIsAvailable(size)) return;
    setSelectedSize(size);
    const matchingColor = product.variants.find((variant) => variant.size === size && variant.available && variant.color !== 'Padrão')?.color;
    setSelectedColor(matchingColor ?? 'A confirmar');
  };

  const productPageUrl = `${window.location.origin}/produto/${product.slug}`;
  const whatsappMessage = [
    `Olá! Tenho interesse no produto ${product.name}, tamanho ${selectedSize || 'a confirmar'}.`,
    'Poderia me informar o preço e a disponibilidade?',
    `Link do produto na Pais Store: ${productPageUrl}`,
  ].join('\n');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleAdd = () => {
    if (product.available && selectedSize && !sizeIsAvailable(selectedSize)) return;
    onAddToBag({ product, selectedSize: selectedSize || 'A confirmar', selectedColor, quantity: 1 });
    setAddedSuccess(true);
    window.setTimeout(() => setAddedSuccess(false), 2_500);
  };

  return (
    <div id="product-detail-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs" onMouseDown={onClose}>
      <div
        id="product-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto border-4 border-black bg-white shadow-2xl md:flex-row"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          id="close-modal-x"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 border-2 border-black bg-white p-2.5 text-gray-800 transition-colors hover:bg-black hover:text-white"
          aria-label="Fechar detalhes do produto"
        >
          <X className="h-5 w-5" />
        </button>

        <section className="flex flex-col justify-between border-b-2 border-black bg-gray-50 p-6 md:w-1/2 md:border-b-0 md:border-r-2 md:p-8">
          <div className="flex min-h-[250px] flex-1 items-center justify-center md:min-h-[350px]">
            <img
              id="selected-modal-image"
              src={activeImage}
              alt={product.name}
              className="max-h-[380px] w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  id={`thumbnail-${index}`}
                  onClick={() => setActiveImage(image)}
                  className={`h-16 w-16 shrink-0 overflow-hidden border-2 transition-all ${activeImage === image ? 'scale-105 border-[#FF3B30]' : 'border-black opacity-60 hover:opacity-100'}`}
                  aria-label={`Mostrar imagem ${index + 1} de ${product.name}`}
                >
                  <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col justify-between p-6 text-left md:w-1/2 md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3B30]">{product.brand}</span>
              <span className="border border-black bg-black px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-white">{product.category}</span>
            </div>
            <h1 id="product-detail-title" className="mt-3 font-display text-2xl font-black uppercase leading-tight tracking-tighter text-black">{product.name}</h1>

            <div className={`mt-4 border-2 border-black p-4 ${product.available ? 'bg-[#F8F8F8]' : 'bg-gray-100'}`}>
              <div className="flex items-center justify-between gap-3 text-xs font-mono font-bold uppercase text-gray-500">
                <span>Disponibilidade</span>
                <span className={`border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white ${product.available ? 'border-black bg-[#FF3B30]' : 'border-gray-500 bg-gray-600'}`}>
                  {product.available ? 'Disponível' : 'Esgotado'}
                </span>
              </div>
              <p className="mt-2 font-sans text-xl font-black uppercase text-black">Preço sob consulta</p>
              <p className="mt-1 font-mono text-[10px] font-bold uppercase text-gray-500">
                {product.available ? `${product.totalStock} unidade${product.totalStock === 1 ? '' : 's'} em estoque` : 'Sem disponibilidade no momento'}
              </p>
            </div>

            {product.description && <p className="mt-5 text-xs font-medium uppercase leading-relaxed text-gray-600">{product.description}</p>}

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-4 font-mono text-[10px] font-black uppercase tracking-widest text-black">
                  <label>Tamanho</label>
                  <span className="text-[9px] text-gray-400">Indisponíveis não podem ser selecionados</span>
                </div>
                {sizes.length ? (
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const available = sizeIsAvailable(size);
                      return <button key={size} id={`size-option-${size}`} disabled={!available} onClick={() => chooseSize(size)} className={`min-w-11 border-2 px-3 py-2 text-xs font-mono font-black transition-all disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 ${selectedSize === size ? 'border-black bg-black text-white' : 'border-black bg-white text-gray-700 hover:border-[#FF3B30] hover:text-[#FF3B30]'}`}>{size}</button>;
                    })}
                  </div>
                ) : <p className="text-xs text-gray-500">Tamanho não informado; confirme pelo WhatsApp.</p>}
              </div>

              {colors.length > 0 && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-4 font-mono text-[10px] font-black uppercase tracking-widest text-black">
                    <label>Cor</label>
                    <span className="text-[9px] text-gray-400">Conforme o tamanho selecionado</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => {
                      const available = colorIsAvailable(color);
                      return <button key={color} disabled={!available} onClick={() => setSelectedColor(color)} className={`border-2 px-3.5 py-2 text-xs font-mono font-bold transition-all disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 ${selectedColor === color ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-black bg-white text-gray-700 hover:bg-black hover:text-white'}`}>{color}</button>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3 border-t-2 border-black pt-5">
            <a id="direct-whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FF3B30] py-4 font-mono text-xs font-black uppercase tracking-widest text-white shadow-xs transition-all hover:bg-black">
              <MessageCircle className="h-5 w-5 fill-current" />
              Consultar pelo WhatsApp
            </a>
            <button id="add-to-bag-modal-button" onClick={handleAdd} disabled={product.available && Boolean(selectedSize) && !sizeIsAvailable(selectedSize)} className={`flex w-full items-center justify-center gap-2 border-2 border-black py-3.5 font-mono text-xs font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${addedSuccess ? 'border-green-600 bg-green-100 text-green-800' : 'bg-black text-white hover:bg-white hover:text-black'}`}>
              {addedSuccess ? <><Check className="h-5 w-5" />Item adicionado</> : <><ShoppingBag className="h-4 w-4" />{isInBag ? 'Adicionar outra opção' : 'Adicionar à lista'}</>}
            </button>
            <div className="flex gap-2 border-2 border-[#FF3B30] bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
              <p className="text-[10px] font-semibold uppercase leading-relaxed text-amber-900">Este é um catálogo de consulta: não há carrinho, checkout ou cobrança nesta página.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
