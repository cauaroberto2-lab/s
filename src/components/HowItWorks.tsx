/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MessageCircle, UserCheck, HelpCircle, CheckSquare } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: <Search className="h-6 w-6 text-[#FF3B30] group-hover:text-white" />,
      title: 'ESCOLHA NO CATÁLOGO',
      description: 'Navegue pelo nosso portfólio premium. Filtre por marca, modelo ou tamanho e adicione os itens que você gostou à sua Lista de Interesse.',
    },
    {
      number: '02',
      icon: <MessageCircle className="h-6 w-6 text-[#FF3B30] group-hover:text-white" />,
      title: 'SOLICITE DISPONIBILIDADE',
      description: 'Envie sua lista de interesse pelo botão de envio rápido ou clique em "Consultar" no produto. Isso gera uma mensagem automática para nosso WhatsApp.',
    },
    {
      number: '03',
      icon: <UserCheck className="h-6 w-6 text-[#FF3B30] group-hover:text-white" />,
      title: 'CONFIRMAÇÃO DO VENDEDOR',
      description: 'Um vendedor parceiro especializado responde você diretamente para checar seu tamanho, cor desejada, valor atualizado e prazo estimado.',
    },
    {
      number: '04',
      icon: <CheckSquare className="h-6 w-6 text-[#FF3B30] group-hover:text-white" />,
      title: 'CONCLUSÃO SEGURA',
      description: 'Após confirmar todos os detalhes do produto e prazo, você recebe instruções simples de pagamento e envio para prosseguirmos com seu pedido.',
    },
  ];

  return (
    <section id="como-funciona" className="bg-white py-16 sm:py-24 border-b-2 border-black scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title Group */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3B30]">
            TRANSPARÊNCIA MÁXIMA
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-black sm:text-4xl uppercase">
            Como funciona nosso atendimento?
          </h2>
          <p className="mt-4 font-sans text-sm text-gray-600 sm:text-base leading-relaxed">
            GARANTIMOS O ACESSO AOS MODELOS MAIS RAROS E EXCLUSIVOS COM TOTAL SEGURANÇA. 
            COMO TRABALHAMOS SOB DEMANDA, CADA ATENDIMENTO É PERSONALIZADO POR NOSSA EQUIPE.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative rounded-none border-2 border-black bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-300 group"
            >
              {/* Step indicator */}
              <div className="absolute right-6 top-6 font-display text-4xl font-extrabold tracking-tighter text-gray-200 group-hover:text-[#FF3B30]/20 transition-colors">
                {step.number}
              </div>

              {/* Icon Container */}
              <div className="flex h-12 w-12 items-center justify-center rounded-none border border-black bg-white group-hover:bg-[#FF3B30] group-hover:border-[#FF3B30] transition-colors duration-300 mb-6">
                <span>{step.icon}</span>
              </div>

              {/* Content */}
              <h3 className="font-display text-base font-black text-black mb-2 uppercase">
                {step.title}
              </h3>
              <p className="font-sans text-xs text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Informative Note Box */}
        <div className="mt-12 rounded-none bg-[#F8F8F8] border-2 border-black p-6 max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <HelpCircle className="h-6 w-6 text-[#FF3B30] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-display text-sm font-extrabold text-black mb-1 uppercase">
              Por que trabalhamos com atendimento humano em vez de checkout automático?
            </h4>
            <p className="font-sans text-xs text-gray-600 leading-relaxed uppercase">
              No mercado de sneakers e moda de alta gama, os valores e estoques oscilam diariamente no mundo todo. 
              Ao invés de cobrar um valor fixo e correr o risco de não conseguir o modelo ou tamanho correto, 
              nosso vendedor busca as melhores cotações globais e prazos atualizados em tempo real antes de você efetuar o pagamento.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
