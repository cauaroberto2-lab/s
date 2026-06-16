/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, Instagram, Send, MessageSquare, ShieldCheck, MapPin, Globe } from 'lucide-react';
import { INSTAGRAM_LINK, WHATSAPP_PHONE } from '../data';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    interestProduct: '',
    size: '',
    message: ''
  });

  const [formSuccess, setFormSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert('Por favor, preencha os campos obrigatórios (Nome e WhatsApp).');
      return;
    }

    // Build perfect WhatsApp inquiry according to required message structure
    const message = `Olá, gostaria de solicitar uma cotação/encomenda personalizada.\n\n` +
                    `Nome: ${formData.name}\n` +
                    `WhatsApp: ${formData.phone}\n` +
                    `Produto de interesse: ${formData.interestProduct || 'Ex: Retro 1, Yeezy, camiseta, moletom ou boné'}\n` +
                    `Tamanho desejado: ${formData.size || 'Ex: 41, M, G ou GG'}\n` +
                    `Observações: ${formData.message || 'Aguardo retorno.'}\n\n` +
                    `Aguardo o retorno de um vendedor.`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    // Open link
    window.open(whatsappUrl, '_blank');

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setFormData({
        name: '',
        phone: '',
        interestProduct: '',
        size: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <section id="contato" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 scroll-mt-20">
      <div className="overflow-hidden rounded-none bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Brand Connection Info card */}
          <div className="relative overflow-hidden bg-black px-6 py-10 lg:col-span-5 lg:px-10 lg:py-12 text-left text-white flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-black">
            {/* Background vector accents */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div className="absolute -right-1/3 -top-1/3 h-80 w-80 rounded-none bg-[#FF3B30] blur-2xl" />
              <div className="absolute -left-1/3 -bottom-1/3 h-80 w-80 rounded-none bg-[#FF3B30] blur-2xl" />
            </div>

            <div className="relative z-10 space-y-8">
              <div>
                <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3B30]">
                  Pais Store Oficial
                </span>
                <h3 className="mt-2 font-display text-2xl font-black tracking-tighter uppercase sm:text-3xl">
                  Vamos encontrar o seu modelo dos sonhos
                </h3>
                <p className="mt-4 font-sans text-xs text-gray-400 uppercase leading-relaxed font-bold">
                  Não encontrou a cor ou o modelo que procurava no catálogo? Não tem problema, nós buscamos para você! 
                  Preencha o formulário ou fale conosco diretamente nas redes.
                </p>
              </div>

              {/* Informative Items */}
              <div className="space-y-4 font-mono text-[10px] font-bold uppercase tracking-wider">
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#FF3B30] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-black">Envio para todo o Brasil</strong>
                    <span className="text-gray-400">Atendimento e logística baseada em São Paulo - SP</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-[#FF3B30] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-black">Importação e Parcerias</strong>
                    <span className="text-gray-400">Trabalhamos com os melhores fornecedores mundiais autênticos</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-black">Garantia de Qualidade</strong>
                    <span className="text-gray-400">Nossa equipe inspeciona cada acabamento antes das entregas</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="relative z-10 mt-12 pt-8 border-t-2 border-white/10 flex flex-col gap-3 font-mono text-xs">
              
              <a
                id="contact-instagram-btn"
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-none bg-white/10 hover:bg-[#FF3B30] hover:border-[#FF3B30] px-4 py-3 font-extrabold uppercase tracking-widest text-white transition-all border-2 border-white/20 active:scale-98"
              >
                <Instagram className="h-4 w-4 text-white" />
                @paisstoreoficial
              </a>

              <a
                id="contact-whatsapp-btn"
                href={`https://wa.me/${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-none bg-[#FF3B30] hover:bg-white hover:text-black hover:border-white px-4 py-3 font-black uppercase tracking-widest text-white transition-all border-2 border-transparent active:scale-98 shadow-xs"
              >
                <Phone className="h-4 w-4 fill-current" />
                WhatsApp Direto
              </a>

            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="px-6 py-10 lg:col-span-7 lg:px-10 lg:py-12 bg-white text-left">
            <h4 className="font-display text-xl font-black text-black uppercase tracking-tighter">
              Solicitar Orçamento / Encomenda Personalizada
            </h4>
            <p className="mt-1 font-sans text-xs text-gray-500 uppercase font-semibold">
              Preencha os campos abaixo e entraremos em contato via WhatsApp com os valores e prazos atualizados em tempo real.
            </p>

            <form id="contact-custom-form" onSubmit={handleSubmit} className="mt-8 space-y-5 font-mono">
              
              {/* Row: Name and Phone */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                    SEU NOME COMPLETO <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    placeholder="Ex: Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide focus:border-[#FF3B30] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                    SEU WHATSAPP <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    required
                    placeholder="Ex: (51) 99999-9999"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide focus:border-[#FF3B30] outline-none"
                  />
                </div>
              </div>

              {/* Row: Product and Size */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="interestProduct" className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                    SNEAKER / VESTUÁRIO DE INTERESSE
                  </label>
                  <input
                    id="contact-interest-product"
                    type="text"
                    name="interestProduct"
                    placeholder="Ex: Retro 1, Yeezy, camiseta, moletom ou boné"
                    value={formData.interestProduct}
                    onChange={handleChange}
                    className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide focus:border-[#FF3B30] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="size" className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                    TAMANHO DESEJADO
                  </label>
                  <input
                    id="contact-size"
                    type="text"
                    name="size"
                    placeholder="Ex: 41, M, G ou GG"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide focus:border-[#FF3B30] outline-none"
                  />
                </div>
              </div>

              {/* Textarea message */}
              <div>
                <label htmlFor="message" className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                  MENSAGEM / OBSERVAÇÕES ADICIONAIS
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  placeholder="Ex: Alguma observação ou dúvida adicional..."
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-none border-2 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide focus:border-[#FF3B30] outline-none resize-none"
                />
              </div>

              {/* Submit feedback check row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-black">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                  * Campos obrigatórios. Sua consulta será enviada no WhatsApp.
                </span>

                <button
                  id="submit-contact-form"
                  type="submit"
                  className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-none px-6 py-3.5 text-xs font-black tracking-widest uppercase text-white border-2 border-black transition-all duration-200 ${
                    formSuccess
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-black hover:bg-white hover:text-black hover:border-black'
                  }`}
                >
                  {formSuccess ? (
                    <>
                      <span>Mensagem Direcionada!</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Pedir Cotação Segura
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
