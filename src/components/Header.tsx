/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Instagram, Phone, Search } from 'lucide-react';
import { INSTAGRAM_LINK, WHATSAPP_PHONE } from '../data';

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  bagCount: number;
  onOpenBag: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({
  activeSection,
  onNavigate,
  bagCount,
  onOpenBag,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Início' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'como-funciona', label: 'Como Funciona' },
    { id: 'contato', label: 'Contato' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b-2 border-black bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button 
            id="logo-button"
            onClick={() => handleNavClick('inicio')} 
            className="flex items-center gap-2 text-left group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-black text-white font-extrabold tracking-tighter text-xl transition-transform group-hover:scale-105">
              P
            </div>
            <div>
              <span className="font-display text-xl font-black tracking-tighter text-black sm:text-2xl uppercase">
                PAIS<span className="text-[#FF3B30]">.</span>STORE
              </span>
              <span className="hidden sm:block font-mono text-[9px] tracking-widest text-gray-500 uppercase font-bold">
                oficial • premium streetwear
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden md:flex gap-8 lg:gap-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`relative font-sans text-xs font-bold tracking-wider uppercase transition-colors py-2 ${
                activeSection === item.id
                  ? 'text-black font-extrabold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {item.label}
              {activeSection === item.id && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#FF3B30]" />
              )}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Quick Search Toggle */}
          <div className="relative">
            {showSearch ? (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-gray-100 rounded-none border border-black px-3 py-1.5 w-60 sm:w-72 transition-all duration-300">
                <input
                  id="search-input-header"
                  type="text"
                  placeholder="BUSCAR SNEAKER, MOLETOM..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent text-xs w-full outline-none text-gray-800 placeholder-gray-400 uppercase font-bold"
                  autoFocus
                />
                <button 
                  id="close-search-button"
                  onClick={() => {
                    onSearchChange('');
                    setShowSearch(false);
                  }}
                  className="text-gray-400 hover:text-black p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                id="search-toggle-button"
                onClick={() => {
                  setShowSearch(true);
                  handleNavClick('catalogo');
                }}
                className="p-2 text-gray-700 hover:bg-gray-100 hover:text-black rounded-none border border-transparent hover:border-black transition-colors"
                title="Pesquisar catálogo"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Instagram shortcut */}
          <a
            id="instagram-shortcut"
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex p-2 text-gray-700 hover:bg-gray-100 hover:text-black rounded-none border border-transparent hover:border-black transition-colors"
            title="Siga no Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>

          {/* Interest Bag Button */}
          <button
            id="bag-toggle-button"
            onClick={onOpenBag}
            className="group relative flex items-center gap-2 rounded-none border-2 border-black bg-black px-4 py-2 text-white shadow-xs hover:bg-[#FF3B30] hover:border-[#FF3B30] transition-all active:scale-95"
            title="Lista de Interesse"
          >
            <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline font-sans text-xs font-bold tracking-wider uppercase">Minha Lista</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-none bg-[#FF3B30] group-hover:bg-black font-mono text-[10px] font-black text-white transition-all">
              {bagCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 hover:bg-gray-150 hover:text-black rounded-none md:hidden transition-colors"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-drawer" className="md:hidden border-t border-gray-100 bg-white/98 shadow-lg">
          <div className="space-y-1.5 px-4 py-5 pb-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`mobile-nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center rounded-xl px-4 py-3 text-base font-bold transition-all ${
                  activeSection === item.id
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between px-4">
              <a
                id="mobile-instagram-link"
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black"
              >
                <Instagram className="h-5 w-5 text-red-600" />
                @paisstoreoficial
              </a>
              <a
                id="mobile-support-link"
                href={`https://wa.me/${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-tight text-green-600"
              >
                <Phone className="h-4 w-4" />
                Fale Conosco
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
