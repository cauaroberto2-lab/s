/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, Send, MessageCircle, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { InterestItem } from '../types';
import { WHATSAPP_PHONE } from '../data';

interface InterestBagProps {
  isOpen: boolean;
  onClose: () => void;
  items: InterestItem[];
  onRemoveItem: (index: number) => void;
  onClearBag: () => void;
}

export default function InterestBag({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearBag,
}: InterestBagProps) {
  if (!isOpen) return null;

  const [clientName, setClientName] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Compile full list into a readable WhatsApp message structure
  const handleGenerateWppLink = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setValidationError('Por favor, informe seu nome completo.');
      return;
    }

    setValidationError('');

    let message = `Olá, gostaria de solicitar uma cotação/encomenda personalizada dos seguintes produtos:\n\n` +
                  `Nome: ${clientName.trim()}\n` +
                  `WhatsApp: (A entrar em contato)\n\n` +
                  `Produtos de Interesse:\n`;

    items.forEach((item, index) => {
      message += `- *Item #${index + 1}:* ${item.product.name}\n` +
                 `  Tamanho desejado: ${item.selectedSize}\n` +
                 `  Opção de Cor: ${item.selectedColor}\n\n`;
    });

    if (extraNotes.trim()) {
      message += `Observações: ${extraNotes.trim()}\n\n`;
    }

    message += `Aguardo o retorno de um vendedor para consultar a disponibilidade e prosseguir com o pedido.`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5551985758791?text=${encodedMsg}`;

    // Open link in new page
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div id="bag-sidebar-overlay" className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* Backdrop click closer */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Main Drawer Shell */}
      <div 
        id="bag-drawer"
        className="w-full max-w-md bg-white h-full flex flex-col border-l-4 border-black shadow-2xl relative animate-in slide-in-from-right duration-300 pointer-events-auto"
      >
        {/* Header toolbar */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-black text-white">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-black uppercase tracking-wider">Sua Lista de Interesse</span>
            <span className="rounded-none bg-[#FF3B30] border border-black px-2 py-0.5 text-xs font-mono font-black text-white">
              {items.length}
            </span>
          </div>
          <button
            id="close-bag-sidebar"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#FF3B30] hover:border-black rounded-none transition-colors border border-transparent cursor-pointer"
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* List scroll container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {items.length === 0 ? (
            /* Empty State Portuguese Template */
            <div className="flex flex-col items-center justify-center h-64 text-center mt-12 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-none border-2 border-black bg-gray-50 text-gray-400">
                <Trash2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black uppercase text-black">Sua lista está vazia</h3>
                <p className="font-mono text-[10px] text-gray-400 max-w-[240px] mx-auto mt-1 leading-relaxed uppercase font-bold">
                  Explore nosso catálogo premium, selecione seus modelos favoritos e monte sua lista de consulta rápida.
                </p>
              </div>
              <button
                id="explore-empty-bag-btn"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 rounded-none border-2 border-black bg-[#FF3B30] px-4.5 py-2.5 font-sans text-xs font-black uppercase text-white hover:bg-black hover:border-black transition-colors cursor-pointer"
              >
                Explorar Catálogo
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            /* Item loop cards */
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  id={`bag-item-card-${index}`}
                  className="flex gap-3 rounded-none border-2 border-black p-3 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-200 transition-all bg-white text-left"
                >
                  <img
                    src={item.product.images[0] || null}
                    alt={item.product.name}
                    className="h-16 w-16 rounded-none object-cover border-2 border-black bg-gray-50"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="font-display text-xs font-black uppercase text-black leading-snug line-clamp-1">
                      {item.product.name}
                    </h4>
                    <div className="mt-1 flex flex-wrap gap-1 text-[9px] font-mono leading-none">
                      <span className="rounded-none border border-black bg-[#F8F8F8] px-1.5 py-0.5 text-black font-extrabold uppercase">
                        TAM: {item.selectedSize}
                      </span>
                      <span className="rounded-none border border-black bg-[#F8F8F8] px-1.5 py-0.5 text-black font-extrabold uppercase">
                        COR: {item.selectedColor}
                      </span>
                    </div>
                    <div className="mt-2 p-1.5 bg-[#F8F8F8] border-l-2 border-[#FF3B30] text-[10px] text-gray-600 font-mono font-bold uppercase inline-block">
                      Sob Consulta com Vendedor
                    </div>
                  </div>
                  <button
                    id={`remove-bag-item-${index}`}
                    onClick={() => onRemoveItem(index)}
                    className="p-1 hover:text-[#FF3B30] text-gray-400 self-start transition-colors cursor-pointer"
                    title="Remover Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex justify-between pt-2">
                <button
                  id="clear-bag-btn"
                  onClick={onClearBag}
                  className="text-[10px] text-gray-500 hover:text-[#FF3B30] font-bold uppercase tracking-widest font-mono cursor-pointer"
                >
                  Limpar lista inteira
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom checkout action layout (Only visible if item exists) */}
        {items.length > 0 && (
          <div className="p-5 border-t-4 border-black bg-[#F8F8F8]">
            
            {/* Disclaimer alerting about availability queries */}
            <div className="flex gap-2 p-3 bg-amber-50 border-2 border-[#FF3B30] mb-4 text-left">
              <AlertTriangle className="h-4 w-4 text-[#FF3B30] shrink-0 mt-0.5" />
              <p className="font-sans text-[10px] text-amber-900 leading-normal uppercase font-bold">
                Sua lista serve apenas para facilitar o contato de orçamento e validação de estoque com nosso vendedor parceiro no WhatsApp.
              </p>
            </div>

            {/* Form for Customer Details */}
            <form id="bag-whatsapp-form" onSubmit={handleGenerateWppLink} className="space-y-3.5 text-left">
              
              {/* Customer name input field */}
              <div>
                <label className="flex items-center gap-1.5 font-mono text-[10px] font-black text-black uppercase tracking-wider mb-1.5">
                  <User className="h-3.5 w-3.5 text-black" />
                  SEU NOME COMPLETO <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  id="client-name-input"
                  type="text"
                  required
                  placeholder="EX: Seu nome completo"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full rounded-none border-2 border-black bg-white px-3.5 py-3 text-xs focus:border-[#FF3B30] uppercase tracking-wider font-bold outline-none font-mono"
                />
                {validationError && (
                  <p id="client-name-error" className="mt-1 font-mono text-[10px] font-black uppercase text-[#FF3B30]">
                    {validationError}
                  </p>
                )}
              </div>

              {/* Extra instructions / comments notes */}
              <div>
                <label className="font-mono text-[10px] font-black text-black uppercase tracking-wider block mb-1.5">
                  OBSERVAÇÕES ADICIONAIS (OPCIONAL)
                </label>
                <textarea
                  id="client-notes-textarea"
                  rows={2}
                  placeholder="EX: GOSTARIA DE SABER DISPONIBILIDADE OU TRABALHA COM PIX."
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className="w-full rounded-none border-2 border-black bg-white px-3.5 py-2.5 text-[10px] focus:border-[#FF3B30] uppercase tracking-wider font-bold outline-none font-mono"
                />
              </div>

              {/* Action push to WhatsApp message dispatcher */}
              <button
                id="submit-bag-whatsapp-btn"
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-none bg-[#FF3B30] hover:bg-black py-4 font-mono text-xs font-black tracking-widest uppercase text-white border-2 border-black transition-all active:scale-98 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5 fill-current" />
                Atendimento pelo WhatsApp (Enviar para vendedor)
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
