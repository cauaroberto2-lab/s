/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { FALLBACK_IMAGE } from '../data';
import type { Product } from '../types';

interface HeroProps {
  onExploreCatalog: () => void;
  onContactSeller: () => void;
  highlightProduct?: Product;
}

export default function Hero({ onExploreCatalog, onContactSeller, highlightProduct }: HeroProps) {
  return (
    <section id="inicio" className="relative overflow-hidden bg-[#111111] py-16 sm:py-24 md:py-32 select-none border-b-4 border-black">
      
      {/* Abstract Background Design Elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-none bg-[#FF3B30]/10 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-none bg-orange-600/10 blur-[120px]" />
        {/* Stark grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Main Copywriting Block */}
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-none border border-[#FF3B30] bg-[#FF3B30]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#FF3B30]">
              <Sparkles className="h-3.5 w-3.5" />
              Pais Store Oficial
            </div>

            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tighter text-white sm:text-5xl md:text-7xl uppercase leading-[0.95]">
              Os modelos <br />
              mais desejados <br />
              <span className="text-[#FF3B30]">do streetwear.</span>
            </h1>

            <p className="mt-6 max-w-2xl font-sans text-sm tracking-wide text-gray-300 sm:text-base leading-relaxed">
              ESCOLHA SEU SNEAKER, VESTUÁRIO OU ACESSÓRIO FAVORITO E CONSULTE DISPONIBILIDADE COM NOSSA EQUIPE. 
              TRABALHAMOS COM ENCOMENDAS PERSONALIZADAS PARA GARANTIR AS PEÇAS MAIS COBIÇADAS DO CENÁRIO GLOBAL.
            </p>

            {/* Crucial stock disclaimer clearly written */}
            <div className="mt-8 flex items-start gap-4 rounded-none bg-black border-l-4 border-[#FF3B30] p-5 max-w-2xl text-left">
              <AlertCircle className="h-5 w-5 text-[#FF3B30] shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-widest text-[#FF3B30] block mb-1">
                  Aviso de Disponibilidade
                </span>
                <p className="font-sans text-xs text-gray-400 leading-relaxed uppercase">
                  Trabalhamos com produtos sob consulta e encomenda. A disponibilidade, tamanhos, cores, prazos e o valor final 
                  de cada item são confirmados de forma individual e exclusiva por um vendedor parceiro no atendimento via WhatsApp.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <button
                id="hero-explore-button"
                onClick={onExploreCatalog}
                className="inline-flex items-center justify-center gap-2 rounded-none bg-[#FF3B30] px-6 py-4 font-sans text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black hover:border-white border-2 border-[#FF3B30] active:scale-95 group shadow-xs"
              >
                Ver Catálogo Completo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="hero-whatsapp-button"
                onClick={onContactSeller}
                className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-white/40 bg-transparent px-6 py-4 font-sans text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black hover:border-white active:scale-95"
              >
                <MessageCircle className="h-5 w-5 text-green-500" />
                Consultar WhatsApp
              </button>
            </div>

            {/* Small Quick-Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-t border-white/10 pt-8">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>Atendimento 100% Humano</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                <span>Modelos Exclusivos</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-[#FF3B30]" />
                <span>Qualidade Sem Igual</span>
              </div>
            </div>
          </div>

          {/* Decorative Sneaker Hero Image / Styling container */}
          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative h-64 w-64 sm:h-96 sm:w-96 rounded-none bg-gradient-to-tr from-[#FF3B30]/20 to-transparent flex items-center justify-center border-4 border-black p-4">
              {/* Spinning/floating ambient visual rings */}
              <div className="absolute inset-0 border-2 border-dashed border-white/10 animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-4 border border-white/5 animate-[spin_40s_linear_infinite_reverse]" />
              
              <img
                id="hero-banner-image"
                src={highlightProduct?.images[0] || FALLBACK_IMAGE}
                alt={highlightProduct ? highlightProduct.name : 'Produto em destaque da Pais Store'}
                className="animate-float z-10 w-[110%] h-[110%] object-contain rotate-[-15deg] transition-transform duration-500 hover:rotate-0 drop-shadow-[0_20px_20px_rgba(255,59,48,0.25)] filter contrast-115"
                referrerPolicy="no-referrer"
                onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
              />

              {/* Float floating badges tags */}
              <div className="absolute -top-4 right-8 bg-black border-2 border-[#FF3B30] px-3 py-1.5 rounded-none font-mono text-[9px] font-bold text-[#FF3B30] uppercase tracking-widest shadow-xs">
                {highlightProduct ? `# ${highlightProduct.brand}` : '# Catálogo'}
              </div>
              <div className="absolute bottom-4 left-4 bg-black border-2 border-white px-3 py-1.5 rounded-none font-mono text-[9px] font-bold text-white uppercase tracking-widest shadow-xs">
                {highlightProduct ? `# ${highlightProduct.category}` : '# Pais Store'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
