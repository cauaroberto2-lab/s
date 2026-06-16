/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Trash2, X, MessageCircle, AlertCircle, ShoppingBag, 
  HelpCircle, Instagram, Phone, Compass, CheckCircle2, ChevronRight, Filter, RefreshCw
} from 'lucide-react';

// Data and Type imports
import { SUBCATEGORIES } from './data';
import { Product, InterestItem, FilterState } from './types';
import { getProducts, getCategories, getBrands, getStoreConfig, initDatabase, AdminProduct } from './utils/db';

// Component imports
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import InterestBag from './components/InterestBag';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Database Initialisation and dynamic structures
  useEffect(() => {
    initDatabase();
  }, []);

  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path.startsWith('/admin')) return '/admin';
    const hash = window.location.hash;
    if (hash === '#/admin' || hash === '#admin') return '/admin';
    return '/';
  });

  const [productsList, setProductsList] = useState<AdminProduct[]>(() => getProducts());
  const [categoriesList, setCategoriesList] = useState(() => getCategories());
  const [brandsList, setBrandsList] = useState(() => getBrands());
  const [storeConfig, setStoreConfig] = useState(() => getStoreConfig());

  // Listen for hash and path changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path.startsWith('/admin') || hash === '#/admin' || hash === '#admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath('/');
        // When coming back to store, synchronize local state fully
        setProductsList(getProducts());
        setCategoriesList(getCategories());
        setBrandsList(getBrands());
        setStoreConfig(getStoreConfig());
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    
    // Also run initially
    handleLocationChange();
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Map to historical naming within component scope, filtering inactive ones for users
  const SAMPLE_PRODUCTS = productsList.filter(p => p.isActive);
  const CATEGORIES = categoriesList;
  const BRANDS = brandsList;
  const WHATSAPP_PHONE = storeConfig.whatsappPhone || '5551985758791';
  const INSTAGRAM_LINK = storeConfig.instagramLink || 'https://www.instagram.com/paisstoreoficial';

  // Render Admin Workspace
  if (currentPath === '/admin') {
    return (
      <AdminPanel 
        onBackToStore={() => {
          window.location.hash = '';
          window.history.pushState({}, '', '/');
          // Dispatch popstate to notify change
          window.dispatchEvent(new PopStateEvent('popstate'));
        }} 
      />
    );
  }

  // 1. Core navigation and Layout States
  const [activeSection, setActiveSection] = useState('inicio');
  const [bagOpen, setBagOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 2. Filter / Search states
  const [filters, setFilters] = useState<FilterState>({
    category: 'todos',
    subCategory: 'todos',
    brand: 'todos',
    search: '',
  });

  // 3. Collective Interest Bag state - loaded from localStorage if exists
  const [bagItems, setBagItems] = useState<InterestItem[]>(() => {
    try {
      const saved = localStorage.getItem('pais_store_bag_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Synchronization with localStorage
  useEffect(() => {
    localStorage.setItem('pais_store_bag_v1', JSON.stringify(bagItems));
  }, [bagItems]);

  // Handle active navigation highlighting on scroll or manual click
  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      // Offset slightly for the sticky header
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Add Item to List of Interest with specific configuration
  const handleAddToBag = (newItem: InterestItem) => {
    setBagItems(prev => {
      // Check if duplicate is already added (same product, same size, same color)
      const existingIndex = prev.findIndex(
        item => item.product.id === newItem.product.id && 
                item.selectedSize === newItem.selectedSize && 
                item.selectedColor === newItem.selectedColor
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  // Quick Add handler straight from Catalog Cards
  const handleQuickAdd = (product: Product) => {
    const defaultItem: InterestItem = {
      product,
      selectedSize: product.sizes[0] || 'A confirmar',
      selectedColor: product.colors[0] || 'Original',
      quantity: 1
    };
    handleAddToBag(defaultItem);
    // Open bag preview to give beautiful immediately satisfying feedback
    setBagOpen(true);
  };

  const handleRemoveBagItem = (index: number) => {
    setBagItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearBag = () => {
    if (window.confirm('Deseja realmente limpar toda sua Lista de Interesse?')) {
      setBagItems([]);
    }
  };

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  // 5. Product Filtering Logics
  const filteredProducts = SAMPLE_PRODUCTS.filter(product => {
    // Category match
    if (filters.category !== 'todos' && product.category !== filters.category) return false;
    
    // Subcategory/Gender match
    if (filters.subCategory !== 'todos' && product.subCategory !== filters.subCategory && product.subCategory !== 'Unissex') return false;

    // Brand match
    if (filters.brand !== 'todos' && product.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;

    // Search query match (name, brand, or description)
    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      return (
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Sorting logics
  const sortedProducts = [...filteredProducts];

  // Extract featured products list
  const featuredProducts = SAMPLE_PRODUCTS.filter(p => p.isFeatured);

  // Quick setup to direct click to Support WhatsApp
  const handleContactSupportDirect = () => {
    const message = 'Olá! Acessei o site da Pais Store Oficial e gostaria de tirar uma dúvida sobre encomendas.';
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans flex flex-col justify-between selection:bg-red-500 selection:text-white antialiased">
      
      {/* 1. Header Toolbar */}
      <Header 
        activeSection={activeSection}
        onNavigate={handleNavigateSection}
        bagCount={bagItems.length}
        onOpenBag={() => setBagOpen(true)}
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
      />

      {/* 2. Page Content Blocks */}
      <main className="flex-1">

        {/* Hero Area */}
        <Hero 
          onExploreCatalog={() => handleNavigateSection('catalogo')}
          onContactSeller={handleContactSupportDirect}
        />

        {/* 3. Pre-Order Explainer Steps */}
        <HowItWorks />

        {/* 4. Interactive Product Catalog Section */}
        <section id="catalogo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-gray-150 scroll-mt-20">
          
          {/* Section heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 select-none">
            <div className="text-left">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-red-500">
                Lançamentos & Encomendas
              </span>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
                Catálogo Premium
              </h2>
              <p className="mt-2 text-sm text-gray-505">
                Escolha os modelos desejados, veja detalhes e monte sua lista de consulta WhatsApp.
              </p>
            </div>

            {/* Quick counters */}
            <div className="flex items-center gap-1.5 self-start text-xs font-mono font-bold text-gray-500 bg-gray-100 px-3.5 py-1.5 rounded-full">
              <Compass className="h-4 w-4" />
              <span>{sortedProducts.length} itens correspondidos</span>
            </div>
          </div>

          {/* Catalog Controls Grid */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-8 shadow-xs flex flex-col gap-5 select-none" id="catalog-controls">
            
            {/* Row 1: Search and Category Tabs */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch">
              
              {/* Category selector tabs */}
              <div className="flex flex-wrap gap-2 scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    id={`cat-tab-${cat.id}`}
                    onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                    className={`px-4.5 py-2.5 rounded-xl font-sans text-xs font-bold tracking-wide transition-all border whitespace-nowrap ${
                      filters.category === cat.id
                        ? 'border-black bg-black text-white shadow-xs'
                        : 'border-gray-200 text-gray-650 hover:border-black hover:text-black bg-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Text Search input frame */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="catalog-search-field"
                  type="text"
                  placeholder="Pesquisar tênis, marca, moletom..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-sans focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500 uppercase tracking-wide placeholder-gray-400"
                />
              </div>

            </div>

            {/* Row 2: Secondary Filters line */}
            <div className="flex flex-wrap gap-x-6 gap-y-3.5 pt-4 border-t border-gray-100 text-xs items-center">
              
              {/* Brand dropdown */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-400 font-bold uppercase tracking-wider text-[10px]">Marca:</span>
                <select
                  id="brand-select-filter"
                  value={filters.brand}
                  onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-black cursor-pointer"
                >
                  <option value="todos">Todas as Marcas</option>
                  {BRANDS.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Sub-category Gender dropdown */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-400 font-bold uppercase tracking-wider text-[10px]">Segmento:</span>
                <select
                  id="subcat-select-filter"
                  value={filters.subCategory}
                  onChange={(e) => setFilters(prev => ({ ...prev, subCategory: e.target.value }))}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-black cursor-pointer"
                >
                  {SUBCATEGORIES.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>

              {/* No sorting options needed - items are ordered by catalog relevance */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-mono text-gray-400 font-bold uppercase tracking-wider text-[10px]">Catálogo por Encomenda</span>
              </div>

              {/* Clear triggers button (Active if filter differs from default) */}
              {(filters.category !== 'todos' || filters.subCategory !== 'todos' || filters.brand !== 'todos' || filters.search) && (
                <button
                  id="clear-filters-quick"
                  onClick={() => setFilters({
                    category: 'todos',
                    subCategory: 'todos',
                    brand: 'todos',
                    search: '',
                  })}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 ml-2 transition-colors py-1 px-2 border border-red-200 rounded-lg bg-red-50 py-pointer cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              )}

            </div>

          </div>

          {/* Grid Products View list */}
          {sortedProducts.length === 0 ? (
            /* Empty Grid Portuguese Fallback template */
            <div className="rounded-3xl border border-dashed border-gray-150 py-16 text-center select-none bg-white">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
                <AlertCircle className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-sans text-base font-extrabold text-black">
                Nenhum produto correspondido
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto font-sans leading-relaxed">
                Não encontramos itens com as configurações atuais. Tente buscar por outros termos ou marcas na barra superior.
              </p>
              <button
                id="reset-search-on-empty"
                onClick={() => setFilters({
                  category: 'todos',
                  subCategory: 'todos',
                  brand: 'todos',
                  search: '',
                })}
                className="mt-6 rounded-xl bg-black px-4.5 py-2.5 text-xs font-bold text-white hover:bg-red-950 transition-colors shadow-sm cursor-pointer"
              >
                Resetar Filtros do Catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedProducts.map(prod => (
                <ProductCard 
                  key={prod.id}
                  product={prod}
                  onSelect={setSelectedProduct}
                  onAddToBagQuick={handleQuickAdd}
                  isInBag={bagItems.some(item => item.product.id === prod.id)}
                />
              ))}
            </div>
          )}

        </section>

        {/* 5. Highlight Section / Mais Pedidos */}
        <section id="mais-pedidos" className="bg-neutral-950 py-16 sm:py-24 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            {/* Title */}
            <div className="text-center max-w-3xl mx-auto mb-16 select-none">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-red-500">
                Streetwear Estilo de Vida
              </span>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Mais Pedidos pelos Clientes
              </h2>
              <p className="mt-4 text-sm text-gray-400 font-sans">
                Estes são os campeões de solicitações da Pais Store. Garanta sua cotação personalizada direto com nosso vendedor parceiro no WhatsApp!
              </p>
            </div>

            {/* Slider list featuring isFeatured items */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map(prod => (
                <div
                  key={`feat-${prod.id}`}
                  onClick={() => setSelectedProduct(prod)}
                  className="group relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-4 transition-all hover:border-neutral-700 hover:-translate-y-1 duration-300 cursor-pointer text-left"
                >
                  <span className="absolute right-3 top-3 z-15 bg-red-600 font-mono text-[8px] font-bold uppercase text-white rounded-md px-2 py-0.5">
                    RECOMENDADO
                  </span>

                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-neutral-950">
                    <img 
                      src={prod.images[0] || null} 
                      alt="" 
                      className="h-full w-full object-cover transition-transform duration-500 scale-100 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const fallbackMap: {[key: string]: string} = {
                          tenis: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
                          roupas: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
                          acessorios: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80'
                        };
                        e.currentTarget.src = fallbackMap[prod.category] || fallbackMap.tenis;
                      }}
                    />
                  </div>

                  <div className="mt-4">
                    <span className="font-mono text-[10px] font-bold text-gray-500 uppercase">{prod.brand}</span>
                    <h4 className="font-sans text-[14px] font-bold text-white group-hover:text-red-500 transition-colors mt-0.5 truncate">
                      {prod.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Referência</span>
                      <span className="text-red-400 font-bold font-mono">SOB CONSULTA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 6. Dynamic Interactive WhatsApp Banner Section */}
        <section className="bg-red-50 border-y border-red-100 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center sm:text-left select-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-red-600 block uppercase">Canal Oficial Pais Store</span>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-black">
                  Quer fazer um pedido de importação de modelo fora do catálogo?
                </h3>
                <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-2xl leading-relaxed">
                  Podemos localizar qualquer silhueta de tênis, jaqueta puffer ou moletom que você viu no Instagram oficial. 
                  Chame agora no WhatsApp de suporte e fale com nossa consultoria humana de moda.
                </p>
              </div>

              <button
                id="wpp-banner-action"
                onClick={handleContactSupportDirect}
                className="bg-black hover:bg-red-950 text-white px-6 py-3.5 rounded-xl font-sans text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95 shrink-0 shadow-lg shadow-black/10"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                Falar com Equipe no WhatsApp
              </button>

            </div>
          </div>
        </section>

        {/* 7. Contact / Dúvida Form Section */}
        <ContactForm />

      </main>

      {/* 3. Footer Section */}
      <Footer onNavigate={handleNavigateSection} />

      {/* 4. Sliding Drawer Side Bag */}
      <InterestBag
        isOpen={bagOpen}
        onClose={() => setBagOpen(false)}
        items={bagItems}
        onRemoveItem={handleRemoveBagItem}
        onClearBag={handleClearBag}
      />

      {/* 5. Product Preview Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToBag={handleAddToBag}
        isInBag={selectedProduct ? bagItems.some(item => item.product.id === selectedProduct.id) : false}
      />

      {/* 6. Glowing Floating WhatsApp Assistant Button */}
      <a
        id="floating-wpp-btn"
        href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Olá! Acessei o catálogo da Pais Store Oficial de consulta e gostaria de iniciar uma conversa.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-300 animate-bounce group"
        title="Chamar suporte no WhatsApp"
      >
        <MessageCircle className="h-7 w-7 transition-transform group-hover:rotate-[15deg] fill-current" />
        
        {/* Pulsating ring indicator */}
        <span className="absolute inset-0 rounded-full bg-green-600/35 animate-ping -z-10" />
      </a>

    </div>
  );
}
