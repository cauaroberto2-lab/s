import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Compass, MessageCircle, RefreshCw, Search } from 'lucide-react';
import { WHATSAPP_PHONE } from './data';
import type { CatalogData, FilterState, InterestItem, Product } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import InterestBag from './components/InterestBag';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import AdminFeaturedPanel from './components/AdminFeaturedPanel';

type CatalogStatus = 'loading' | 'ready' | 'error';
type FeaturedConfigurationStatus = 'loading' | 'ready' | 'error';

interface FeaturedConfiguration {
  featuredProductId: string | null;
  updatedAt: string | null;
}

function getProductFromLocation(products: Product[]) {
  const match = window.location.pathname.match(/^\/produto\/([^/]+)\/?$/);
  return match ? products.find((product) => product.slug === decodeURIComponent(match[1])) ?? null : null;
}

function updatePageMetadata(product: Product | null) {
  const description = product
    ? `${product.name} na Pais Store. ${product.available ? 'Disponibilidade e preço sob consulta pelo WhatsApp.' : 'Produto esgotado no momento.'}`
    : 'Catálogo Pais Store: produtos, tamanhos e disponibilidade atualizados. Preço sob consulta pelo WhatsApp.';
  document.title = product ? `${product.name} | Pais Store` : 'Pais Store Oficial';
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.append(meta);
  }
  meta.content = description;
}

function isCatalog(data: unknown): data is CatalogData {
  return Boolean(data && typeof data === 'object' && (data as CatalogData).schemaVersion === 1 && Array.isArray((data as CatalogData).products));
}

export default function App() {
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('loading');
  const [catalogError, setCatalogError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredConfigurationStatus, setFeaturedConfigurationStatus] = useState<FeaturedConfigurationStatus>('loading');
  const [featuredConfiguration, setFeaturedConfiguration] = useState<FeaturedConfiguration | null>(null);
  const [activeSection, setActiveSection] = useState('inicio');
  const [bagOpen, setBagOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterState>({ category: 'todos', brand: 'todos', size: 'todos', search: '' });
  const [bagItems, setBagItems] = useState<InterestItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('pais_store_bag_v1') ?? '[]') as InterestItem[]; } catch { return []; }
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/catalog.json', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catálogo indisponível (${response.status})`);
        const payload = await response.json() as unknown;
        if (!isCatalog(payload)) throw new Error('Formato inválido do catálogo');
        return payload.products.filter((product) => !product.archived);
      })
      .then((loadedProducts) => {
        setProducts(loadedProducts);
        setSelectedProduct(getProductFromLocation(loadedProducts));
        setBagItems((items) => items.filter((item) => loadedProducts.some((product) => product.id === item.product.id)));
        setCatalogStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCatalogError(error instanceof Error ? error.message : 'Falha ao carregar o catálogo');
        setCatalogStatus('error');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/featured-product', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Destaque indisponível (${response.status})`);
        return await response.json() as FeaturedConfiguration;
      })
      .then((configuration) => {
        setFeaturedConfiguration({ featuredProductId: configuration.featuredProductId ?? null, updatedAt: configuration.updatedAt ?? null });
        setFeaturedConfigurationStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setFeaturedConfigurationStatus('error');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleLocationChange = () => setSelectedProduct(getProductFromLocation(products));
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [products]);

  useEffect(() => {
    if (catalogStatus === 'ready') localStorage.setItem('pais_store_bag_v1', JSON.stringify(bagItems));
  }, [bagItems, catalogStatus]);

  useEffect(() => updatePageMetadata(selectedProduct), [selectedProduct]);

  const categories = useMemo<string[]>(() => Array.from(new Set<string>(products.map((product) => product.category))).sort((left, right) => left.localeCompare(right, 'pt-BR')), [products]);
  const brands = useMemo<string[]>(() => Array.from(new Set<string>(products.map((product) => product.brand))).sort((left, right) => left.localeCompare(right, 'pt-BR')), [products]);
  const sizes = useMemo<string[]>(() => Array.from(new Set<string>(products.flatMap((product) => product.sizes))).sort((left, right) => left.localeCompare(right, 'pt-BR', { numeric: true })), [products]);
  const filteredProducts = useMemo(() => products
    .filter((product) => {
      if (filters.category !== 'todos' && product.category !== filters.category) return false;
      if (filters.brand !== 'todos' && product.brand !== filters.brand) return false;
      if (filters.size !== 'todos' && !product.variants.some((variant) => variant.size === filters.size && variant.available)) return false;
      const query = filters.search.trim().toLocaleLowerCase('pt-BR');
      return !query || [product.name, product.brand, product.category, product.subCategory, product.description].join(' ').toLocaleLowerCase('pt-BR').includes(query);
    })
    .sort((left, right) => Number(right.available) - Number(left.available) || left.name.localeCompare(right.name, 'pt-BR')), [products, filters]);
  const featuredProducts = filteredProducts.filter((product) => product.available).slice(0, 4);
  const configuredHighlight = featuredConfiguration?.featuredProductId
    ? products.find((product) => product.id === featuredConfiguration.featuredProductId) ?? null
    : null;
  const highlightProduct = featuredConfiguration?.featuredProductId
    ? configuredHighlight ?? undefined
    : featuredConfigurationStatus === 'ready'
      ? products.find((product) => product.available)
      : undefined;
  const highlightMissing = Boolean(featuredConfiguration?.featuredProductId && !configuredHighlight);

  const navigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      setSelectedProduct(null);
    }
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    const destination = `/produto/${encodeURIComponent(product.slug)}`;
    if (window.location.pathname !== destination) window.history.pushState({}, '', destination);
  };
  const closeProduct = () => {
    setSelectedProduct(null);
    if (window.location.pathname.startsWith('/produto/')) window.history.pushState({}, '', '/');
  };
  const addToBag = (item: InterestItem) => setBagItems((items) => {
    const duplicate = items.findIndex((entry) => entry.product.id === item.product.id && entry.selectedSize === item.selectedSize && entry.selectedColor === item.selectedColor);
    return duplicate < 0 ? [...items, item] : items.map((entry, index) => index === duplicate ? { ...entry, quantity: entry.quantity + 1 } : entry);
  });
  const quickAdd = (product: Product) => {
    const variant = product.variants.find((entry) => entry.available);
    if (!variant) return;
    addToBag({ product, selectedSize: variant.size, selectedColor: variant.color === 'Padrão' ? 'A confirmar' : variant.color, quantity: 1 });
    setBagOpen(true);
  };
  const resetFilters = () => setFilters({ category: 'todos', brand: 'todos', size: 'todos', search: '' });
  const contactSupport = (product?: Product) => {
    const message = product
      ? `Olá! Acessei o produto em destaque ${product.name} na Pais Store e gostaria de consultar disponibilidade e preço.`
      : 'Olá! Acessei o catálogo da Pais Store e gostaria de tirar uma dúvida sobre disponibilidade.';
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const hasFilters = Object.values(filters).some((value) => value !== 'todos' && value !== '');
  const catalogMessage = catalogStatus === 'loading' ? 'Carregando produtos atualizados…' : catalogStatus === 'error' ? `Não foi possível carregar o catálogo. ${catalogError}` : '';

  if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
    return <AdminFeaturedPanel products={products} catalogStatus={catalogStatus} onBackToStore={() => { window.location.assign('/'); }} />;
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#fafafa] font-sans text-gray-900 antialiased selection:bg-red-500 selection:text-white">
      <Header activeSection={activeSection} onNavigate={navigate} bagCount={bagItems.length} onOpenBag={() => setBagOpen(true)} searchQuery={filters.search} onSearchChange={(search) => setFilters((previous) => ({ ...previous, search }))} />
      <main className="flex-1">
        <Hero onExploreCatalog={() => navigate('catalogo')} onContactSeller={contactSupport} onOpenHighlight={openProduct} highlightProduct={highlightProduct} highlightMissing={highlightMissing} />
        <HowItWorks />
        <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-20 border-b border-gray-150 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><span className="font-mono text-xs font-bold uppercase tracking-widest text-red-500">Catálogo sincronizado</span><h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Catálogo Premium</h2><p className="mt-2 text-sm text-gray-500">Fotos, tamanhos e disponibilidade atualizados. Preço sempre sob consulta.</p></div><div className="flex items-center gap-1.5 self-start rounded-full bg-gray-100 px-3.5 py-1.5 font-mono text-xs font-bold text-gray-500"><Compass className="h-4 w-4" /><span>{catalogStatus === 'ready' ? `${filteredProducts.length} itens encontrados` : 'Sincronizando catálogo'}</span></div></div>
          <div className="mb-8 flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-xs" id="catalog-controls">
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row"><div className="flex flex-wrap gap-2"><button onClick={() => setFilters((previous) => ({ ...previous, category: 'todos' }))} className={`rounded-xl border px-4.5 py-2.5 text-xs font-bold transition-all ${filters.category === 'todos' ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-650 hover:border-black hover:text-black'}`}>Todos os Produtos</button>{categories.map((category) => <button key={category} onClick={() => setFilters((previous) => ({ ...previous, category }))} className={`rounded-xl border px-4.5 py-2.5 text-xs font-bold transition-all ${filters.category === category ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-650 hover:border-black hover:text-black'}`}>{category}</button>)}</div><div className="relative max-w-md flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="catalog-search-field" type="search" placeholder="Pesquisar tênis, marca, moletom..." value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm uppercase tracking-wide placeholder-gray-400 focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500" /></div></div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3.5 border-t border-gray-100 pt-4 text-xs"><label className="flex items-center gap-2"><span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Marca:</span><select value={filters.brand} onChange={(event) => setFilters((previous) => ({ ...previous, brand: event.target.value }))} className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-black"><option value="todos">Todas as marcas</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label><label className="flex items-center gap-2"><span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Tamanho:</span><select value={filters.size} onChange={(event) => setFilters((previous) => ({ ...previous, size: event.target.value }))} className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-black"><option value="todos">Todos os tamanhos</option>{sizes.map((size) => <option key={size}>{size}</option>)}</select></label><span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Disponíveis primeiro</span>{hasFilters && <button onClick={resetFilters} className="ml-2 flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-500 transition-colors hover:text-red-700"><RefreshCw className="h-3.5 w-3.5" />Limpar filtros</button>}</div>
          </div>
          {catalogStatus !== 'ready' ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center"><AlertCircle className="mx-auto h-8 w-8 text-yellow-600" /><h3 className="mt-4 text-base font-extrabold text-black">{catalogStatus === 'error' ? 'Catálogo temporariamente indisponível' : 'Preparando o catálogo'}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{catalogMessage}</p>{catalogStatus === 'error' && <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-black px-4.5 py-2.5 text-xs font-bold text-white hover:bg-red-950">Tentar novamente</button>}</div> : filteredProducts.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center"><AlertCircle className="mx-auto h-8 w-8 text-yellow-600" /><h3 className="mt-4 text-base font-extrabold text-black">Nenhum produto encontrado</h3><p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">Tente outra busca, marca ou tamanho.</p><button onClick={resetFilters} className="mt-6 rounded-xl bg-black px-4.5 py-2.5 text-xs font-bold text-white hover:bg-red-950">Limpar filtros</button></div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={openProduct} onAddToBagQuick={quickAdd} isInBag={bagItems.some((item) => item.product.id === product.id)} />)}</div>}
        </section>
        {featuredProducts.length > 0 && <section id="mais-pedidos" className="bg-neutral-950 py-16 text-white sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto mb-12 max-w-3xl text-center"><span className="font-mono text-xs font-bold uppercase tracking-widest text-red-500">Modelos em destaque</span><h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Disponíveis para consulta</h2><p className="mt-4 text-sm text-gray-400">Tamanhos e disponibilidade são atualizados pela sincronização do catálogo.</p></div><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{featuredProducts.map((product) => <button key={product.id} onClick={() => openProduct(product)} className="group overflow-hidden border border-neutral-800 bg-neutral-900 p-4 text-left transition-all hover:-translate-y-1 hover:border-neutral-700"><img src={product.images[0]} alt={product.name} loading="lazy" className="aspect-square w-full object-cover" /><span className="mt-4 block font-mono text-[10px] font-bold uppercase text-gray-500">{product.brand}</span><h3 className="mt-1 truncate text-sm font-bold text-white group-hover:text-red-500">{product.name}</h3><span className="mt-2 block font-mono text-[10px] font-bold uppercase text-red-400">Preço sob consulta</span></button>)}</div></div></section>}
        <section className="border-y border-red-100 bg-red-50 py-12"><div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left"><div><span className="block font-mono text-xs font-bold uppercase text-red-600">Canal oficial Pais Store</span><h3 className="mt-1 font-display text-xl font-extrabold text-black sm:text-2xl">Não encontrou o modelo desejado?</h3><p className="mt-1 max-w-2xl text-sm text-gray-500">Fale com a equipe para consultar outras opções, tamanhos e disponibilidade.</p></div><button onClick={contactSupport} className="flex shrink-0 items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs font-extrabold text-white transition-all hover:bg-red-950"><MessageCircle className="h-4 w-4 text-green-500" />Falar no WhatsApp</button></div></section>
        <ContactForm />
      </main>
      <Footer onNavigate={navigate} />
      <InterestBag isOpen={bagOpen} onClose={() => setBagOpen(false)} items={bagItems} onRemoveItem={(index) => setBagItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} onClearBag={() => setBagItems([])} />
      <ProductModal product={selectedProduct} onClose={closeProduct} onAddToBag={addToBag} isInBag={Boolean(selectedProduct && bagItems.some((item) => item.product.id === selectedProduct.id))} whatsappPhone={WHATSAPP_PHONE} />
    </div>
  );
}
