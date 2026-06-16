/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ShoppingBag, Truck, Calendar, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Product, InterestItem } from '../types';
import { WHATSAPP_PHONE } from '../data';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (item: InterestItem) => void;
  isInBag: boolean;
}

export default function ProductModal({
  product,
  onClose,
  onAddToBag,
  isInBag,
}: ProductModalProps) {
  if (!product) return null;

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Set default configurations on open
  useEffect(() => {
    setActiveImage(product.images[0]);
    setSelectedSize(product.sizes[0] || '');
    setSelectedColor(product.colors[0] || '');
    setAddedSuccess(false);
  }, [product]);

  // Handle ESC close key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Build direct WhatsApp message for this product
  const getDirectWhatsAppLink = () => {
    const message = `Olá, tenho interesse neste produto: ${product.name}. Gostaria de consultar disponibilidade, tamanho, cor, prazo e valor.`;
    
    return `https://wa.me/5551985758791?text=${encodeURIComponent(message)}`;
  };

  const handleAddClick = () => {
    onAddToBag({
      product,
      selectedSize,
      selectedColor,
      quantity: 1,
    });
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2500);
  };

  return (
    <div id="product-detail-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity duration-300">
      <div 
        id="product-detail-modal"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border-4 border-black bg-white shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        <button
          id="close-modal-x"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2.5 rounded-none border-2 border-black bg-white text-gray-800 hover:bg-black hover:text-white transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Images Section */}
        <div className="md:w-1/2 p-6 md:p-8 bg-gray-50 flex flex-col justify-between border-b md:border-b-0 md:border-r-2 md:border-black">
          <div className="flex-1 flex items-center justify-center min-h-[250px] md:min-h-[350px]">            <img
              id="selected-modal-image"
              src={activeImage || null}
              alt={product.name}
              className="max-h-[300px] md:max-h-[380px] w-auto object-contain transition-transform duration-300 rounded-none"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const fallbackMap: {[key: string]: string} = {
                  tenis: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
                  roupas: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
                  acessorios: 'https://images.unsplash.com/photo-1588850561405-ed78c282e89b?w=800&auto=format&fit=crop&q=80'
                };
                e.currentTarget.src = fallbackMap[product.category] || fallbackMap.tenis;
              }}
            />
          </div>

          {/* Thumbnail slides if multiple images */}
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-2 justify-center">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  id={`thumbnail-${i}`}
                  onClick={() => setActiveImage(img)}
                  className={`h-16 w-16 overflow-hidden rounded-none border-2 transition-all ${
                    activeImage === img ? 'border-[#FF3B30] scale-105' : 'border-black opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img || null} 
                    alt=""  
                    className="h-full w-full object-cover" 
                    onError={(e) => {
                      const fallbackMap: {[key: string]: string} = {
                        tenis: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
                        roupas: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
                        acessorios: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80'
                      };
                      e.currentTarget.src = fallbackMap[product.category] || fallbackMap.tenis;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Content and Interaction Options */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between text-left">
          
          <div>
            {/* Brand and Badge */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3B30]">
                {product.brand}
              </span>
              <span className="rounded-none border border-black bg-black px-2.5 py-0.5 font-mono text-[9px] font-black text-white uppercase tracking-widest leading-none">
                {product.badge || 'Por Encomenda'}
              </span>
            </div>

            {/* Product Title */}
            <h2 className="mt-3 font-display text-2xl font-black text-black uppercase tracking-tighter leading-tight">
              {product.name}
            </h2>

            {/* Price section with Sob Consulta emphasis */}
            <div className="mt-4 rounded-none bg-[#F8F8F8] border-2 border-black p-4">
              <div className="flex items-center justify-between text-xs text-gray-500 font-mono uppercase font-bold">
                <span>Disponibilidade de Estoque</span>
                <span className="font-black text-white bg-[#FF3B30] rounded-none px-1.5 py-0.5 font-mono text-[9px] border border-black uppercase tracking-wider">
                  SOB ENCOMENDA
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-sans text-2xl font-black text-black">
                  SOB CONSULTA
                </span>
                <span className="text-xs text-gray-400 font-mono font-bold uppercase">
                  Sem Pronta Entrega
                </span>
              </div>
            </div>

            {/* Short description */}
            <p className="mt-5 font-sans text-xs text-gray-600 leading-relaxed uppercase font-medium">
              {product.description}
            </p>

            {/* Option pickers (Sizes & Colors) */}
            <div className="mt-6 space-y-5">
              
              {/* Sizes Available Picker */}
              <div>
                <label className="flex items-center justify-between font-mono text-[10px] font-black text-black tracking-widest uppercase mb-2.5">
                  <span>TAMANHO (SELECIONE PARA CONSULTAR)</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Consulte tamanhos adicionais</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      id={`size-option-${size}`}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-11 px-3 py-2 text-xs font-mono font-black rounded-none border-2 transition-all ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-black text-gray-700 hover:border-[#FF3B30] hover:text-[#FF3B30] bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors Available Picker */}
              <div>
                <label className="flex items-center justify-between font-mono text-[10px] font-black text-black tracking-widest uppercase mb-2.5">
                  <span>OPÇÕES DE CORES</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Sob verificação do estoque</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      id={`color-option-${color}`}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-2 text-xs font-mono font-bold rounded-none border-2 transition-all ${
                        selectedColor === color
                          ? 'border-[#FF3B30] bg-[#FF3B30] text-white'
                          : 'border-black text-gray-700 hover:bg-black hover:text-white bg-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Estimated time layout */}
            <div className="mt-6 border-t-2 border-black pt-5 space-y-3 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#FF3B30]" />
                <span>Prazo de Envio estimado: <strong className="text-black font-black">Confirmado pelo vendedor</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#FF3B30]" />
                <span>Trabalhamos sob encomenda com parceiros internacionais verificados</span>
              </div>
            </div>

          </div>

          {/* Core Action Callouts */}
          <div className="mt-8 pt-5 border-t-2 border-black space-y-3">
            
            {/* Primary Option: Consult via direct WhatsApp link */}
            <a
              id="direct-whatsapp-button"
              href={getDirectWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-none border-2 border-black bg-[#FF3B30] hover:bg-black py-4 font-mono text-xs font-black tracking-widest uppercase text-white transition-all shadow-xs"
            >
              <MessageCircle className="h-5 w-5 fill-current text-white" />
              Perguntar no WhatsApp
            </a>

            {/* Secondary Option: Add to the collective interest bag */}
            <button
              id="add-to-bag-modal-button"
              onClick={handleAddClick}
              className={`flex w-full items-center justify-center gap-2 rounded-none py-3.5 font-mono text-xs font-black tracking-widest uppercase transition-all border-2 border-black ${
                addedSuccess
                  ? 'bg-green-100 border-green-600 text-green-800'
                  : 'bg-black text-white hover:bg-white hover:text-black hover:border-black'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="h-5 w-5" />
                  Item Adicionado com Sucesso!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Adicionar à Lista de Interesse
                </>
              )}
            </button>

            {/* Anti-purchase clear text disclaimer */}
            <div className="flex gap-2 p-3 rounded-none bg-amber-50 border-2 border-[#FF3B30]">
              <AlertTriangle className="h-4 w-4 text-[#FF3B30] shrink-0 mt-0.5" />
              <p className="font-sans text-[10px] text-amber-900 leading-relaxed uppercase font-semibold">
                Este site é um **Catálogo por Encomenda**. Não coletamos informações de pagamento. 
                Sua lista serve apenas para facilitar o contato e validação de estoque com nosso vendedor parceiro no WhatsApp.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
