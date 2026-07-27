/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Instagram, Phone, AlertTriangle, ArrowUp, Star, ShieldCheck } from 'lucide-react';
import { INSTAGRAM_LINK, WHATSAPP_PHONE } from '../data';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="bg-[#111111] text-gray-400 font-mono border-t-4 border-black select-none">
      
      {/* Top Banner Accent */}
      <div className="border-b-2 border-black bg-black py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <ShieldCheck className="h-5 w-5 text-[#FF3B30] fill-current" />
            <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
              Atendimento 100% humanizado e transparente por WhatsApp
            </h5>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-mono tracking-widest font-black uppercase">
            <span className="text-[#FF3B30]">CATÁLOGO ATUALIZADO</span>
            <span className="text-gray-500">•</span>
            <span className="text-[#FF3B30]">PREÇO SOB CONSULTA</span>
            <span className="text-gray-500">•</span>
            <span className="text-[#FF3B30]">ATENDIMENTO WHATSAPP</span>
          </div>

        </div>
      </div>

      {/* Main Grid content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          
          {/* Brand Presentation block */}
          <div className="md:col-span-4 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-none border-2 border-white bg-white text-black font-black tracking-tighter text-base">
                P
              </div>
              <span className="font-display text-base font-black tracking-widest text-white uppercase">
                PAIS<span className="text-[#FF3B30]">.</span>STORE
              </span>
            </div>
            
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-400 uppercase font-bold">
              O modelo de tênis ou roupa streetwear dos seus sonhos, direto para seu armário. 
              Trabalhamos como catálogo integrado de encomendas e importações sob consulta para garantir autenticidade e as melhores cotações globais.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <a
                id="footer-insta"
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-black hover:bg-[#FF3B30] text-gray-400 hover:text-white rounded-none border-2 border-white/10 transition-all"
                title="Instagram"
              >
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a
                id="footer-phone"
                href={`https://wa.me/${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-black hover:bg-[#FF3B30] text-gray-400 hover:text-white rounded-none border-2 border-white/10 transition-all"
                title="Consulte WhatsApp"
              >
                <Phone className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* Quick links block */}
          <div className="md:col-span-3 text-left">
            <h5 className="font-mono text-xs font-black uppercase tracking-widest text-white">
              Menu Institucional
            </h5>
            <ul className="mt-4 space-y-2.5 text-[10px] font-black uppercase tracking-widest">
              <li>
                <button
                  id="foot-nav-inicio"
                  onClick={() => onNavigate('inicio')}
                  className="hover:text-[#FF3B30] transition-colors"
                >
                  Início / Novidades
                </button>
              </li>
              <li>
                <button
                  id="foot-nav-catalogo"
                  onClick={() => onNavigate('catalogo')}
                  className="hover:text-[#FF3B30] transition-colors"
                >
                  Catálogo por Encomenda
                </button>
              </li>
              <li>
                <button
                  id="foot-nav-como"
                  onClick={() => onNavigate('como-funciona')}
                  className="hover:text-[#FF3B30] transition-colors"
                >
                  Como Funciona?
                </button>
              </li>
              <li>
                <button
                  id="foot-nav-contato"
                  onClick={() => onNavigate('contato')}
                  className="hover:text-[#FF3B30] transition-colors"
                >
                  Fale Conosco
                </button>
              </li>
            </ul>
          </div>

          {/* Critical Order Stock Policy warning block */}
          <div className="md:col-span-5 text-left bg-black p-6 rounded-none border-2 border-[#FF3B30] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#FF3B30]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <h5 className="font-mono text-[10px] font-black uppercase tracking-widest">
                  Política de Encomendas
                </h5>
              </div>
              <p className="font-sans text-[10px] leading-relaxed text-neutral-400 uppercase font-semibold">
                A Pais Store Oficial vende produtos premium sob consulta. Não oferecemos garantia de estoque imediato no site. 
                Os prazos de importação/envio, taxas e valores de frete são calculados de acordo com sua localidade e acordados 
                diretamente com nosso representação de vendas no WhatsApp.
              </p>
            </div>
            
            <span className="font-mono text-[8px] text-neutral-500 tracking-widest mt-4 block font-black uppercase">
              🔒 SEM COBRANÇA DIRETA PORTAL • PAGOS ACORDADOS EM CANAL OFICIAL
            </span>
          </div>

        </div>

        {/* Lower row details and copyrights */}
        <div className="mt-12 pt-8 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase font-bold text-neutral-500">
          <div className="text-center sm:text-left">
            <p>© 2026 Pais Store Oficial. Todos os direitos reservados.</p>
            <p className="mt-0.5 text-[8px] tracking-wider">As marcas Jordan, Nike, Adidas, Supreme e New Balance citadas são propriedades de seus respectivos detentores.</p>
          </div>

          <button
            id="scroll-to-top-footer"
            onClick={handleScrollTop}
            className="group flex items-center gap-2 rounded-none bg-black hover:bg-[#FF3B30] text-gray-450 hover:text-white py-2.5 px-4 border-2 border-white/10 hover:border-black transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Voltar ao Topo
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
