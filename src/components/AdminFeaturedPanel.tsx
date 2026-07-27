import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, LogIn, LogOut, Save, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { FALLBACK_IMAGE } from '../data';
import type { Product } from '../types';

type CatalogStatus = 'loading' | 'ready' | 'error';

interface FeaturedConfiguration {
  featuredProductId: string | null;
  updatedAt: string | null;
}

interface AdminFeaturedPanelProps {
  products: Product[];
  catalogStatus: CatalogStatus;
  onBackToStore: () => void;
}

function availableSizes(product: Product) {
  const sizes = product.variants.filter((variant) => variant.available).map((variant) => variant.size);
  return [...new Set(sizes.length ? sizes : product.sizes)].sort((left, right) => left.localeCompare(right, 'pt-BR', { numeric: true }));
}

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) return 'ainda não definido';
  const value = new Date(updatedAt);
  return Number.isNaN(value.getTime()) ? 'data indisponível' : value.toLocaleString('pt-BR');
}

function BannerPreview({ product }: { product: Product | null }) {
  const [imageIndex, setImageIndex] = useState(0);
  const image = product?.images[imageIndex] || FALLBACK_IMAGE;

  useEffect(() => setImageIndex(0), [product?.id]);

  return (
    <div className="overflow-hidden border-4 border-black bg-[#111111] p-5 text-white shadow-[8px_8px_0_0_#FF3B30] sm:p-7">
      <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#FF3B30]">
        <Sparkles className="h-4 w-4" /> Prévia do banner
      </div>
      <div className="grid items-center gap-5 sm:grid-cols-[1fr_190px]">
        <div>
          <p className="font-display text-2xl font-black uppercase leading-none tracking-tighter sm:text-3xl">Os modelos<br />mais desejados.</p>
          <p className="mt-3 font-mono text-[10px] font-bold uppercase leading-relaxed text-gray-400">A prévia usa o mesmo enquadramento inclinado e as etiquetas do banner público.</p>
          {product && <p className="mt-4 font-mono text-[10px] font-black uppercase text-white">{product.name}</p>}
        </div>
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center border-4 border-black bg-gradient-to-tr from-[#FF3B30]/30 to-transparent p-3">
          <div className="absolute inset-0 border-2 border-dashed border-white/15" />
          <img
            src={image}
            alt={product?.name ?? 'Prévia neutra'}
            referrerPolicy="no-referrer"
            className="relative z-10 h-[115%] w-[115%] rotate-[-15deg] object-contain drop-shadow-[0_16px_16px_rgba(255,59,48,0.3)]"
            onError={(event) => {
              if (product && imageIndex < product.images.length - 1) setImageIndex((current) => current + 1);
              else event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <span className="absolute -top-3 right-2 z-20 border-2 border-[#FF3B30] bg-black px-2 py-1 font-mono text-[8px] font-black uppercase text-[#FF3B30]"># {product?.brand ?? 'Catálogo'}</span>
          <span className="absolute -bottom-3 left-2 z-20 border-2 border-white bg-black px-2 py-1 font-mono text-[8px] font-black uppercase text-white"># {product?.category ?? 'Pais Store'}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeaturedPanel({ products, catalogStatus, onBackToStore }: AdminFeaturedPanelProps) {
  const [sessionState, setSessionState] = useState<'checking' | 'anonymous' | 'authenticated' | 'unavailable'>('checking');
  const [accessToken, setAccessToken] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [configuration, setConfiguration] = useState<FeaturedConfiguration | null>(null);
  const [configurationError, setConfigurationError] = useState('');
  const [draftProductId, setDraftProductId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('todos');
  const [category, setCategory] = useState('todos');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin-session', { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json() as { authenticated?: boolean; message?: string };
      if (!response.ok) {
        setSessionState('unavailable');
        setAuthMessage(payload.message ?? 'A autenticação administrativa ainda não está configurada.');
        return;
      }
      setSessionState(payload.authenticated ? 'authenticated' : 'anonymous');
    } catch {
      setSessionState('unavailable');
      setAuthMessage('Não foi possível verificar a autenticação administrativa.');
    }
  }, []);

  const loadConfiguration = useCallback(async () => {
    try {
      const response = await fetch('/api/featured-product', { cache: 'no-store' });
      const payload = await response.json() as FeaturedConfiguration & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível carregar o destaque atual.');
      setConfiguration({ featuredProductId: payload.featuredProductId ?? null, updatedAt: payload.updatedAt ?? null });
      setDraftProductId((current) => current ?? payload.featuredProductId ?? null);
      setConfigurationError('');
    } catch (error) {
      setConfigurationError(error instanceof Error ? error.message : 'Não foi possível carregar o destaque atual.');
    }
  }, []);

  useEffect(() => { void checkSession(); }, [checkSession]);
  useEffect(() => { void loadConfiguration(); }, [loadConfiguration]);

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort((left, right) => left.localeCompare(right, 'pt-BR')), [products]);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort((left, right) => left.localeCompare(right, 'pt-BR')), [products]);
  const selectedProduct = useMemo(() => products.find((product) => product.id === draftProductId) ?? null, [draftProductId, products]);
  const savedProduct = useMemo(() => products.find((product) => product.id === configuration?.featuredProductId) ?? null, [configuration?.featuredProductId, products]);
  const selectedWasRemoved = Boolean(configuration?.featuredProductId && !savedProduct);
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return products
      .filter((product) => {
        if (brand !== 'todos' && product.brand !== brand) return false;
        if (category !== 'todos' && product.category !== category) return false;
        return !term || `${product.name} ${product.brand} ${product.category}`.toLocaleLowerCase('pt-BR').includes(term);
      })
      .sort((left, right) => Number(right.available) - Number(left.available) || left.name.localeCompare(right.name, 'pt-BR'));
  }, [brand, category, products, search]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAuthenticating(true);
    setAuthMessage('');
    try {
      const response = await fetch('/api/admin-session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accessToken }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível autenticar.');
      setAccessToken('');
      setSessionState('authenticated');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Não foi possível autenticar.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    await fetch('/api/admin-session', { method: 'DELETE', credentials: 'same-origin' });
    setSessionState('anonymous');
    setSaveState('idle');
  };

  const saveFeaturedProduct = async () => {
    if (!selectedProduct) {
      setSaveState('error');
      setSaveMessage('Selecione um produto válido antes de salvar.');
      return;
    }
    setSaveState('saving');
    setSaveMessage('');
    try {
      const response = await fetch('/api/featured-product', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredProductId: selectedProduct.id }),
      });
      const payload = await response.json() as FeaturedConfiguration & { message?: string };
      if (response.status === 401) {
        setSessionState('anonymous');
        throw new Error('Sua sessão expirou. Entre novamente para salvar.');
      }
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível salvar o destaque.');
      const updated = { featuredProductId: payload.featuredProductId, updatedAt: payload.updatedAt };
      setConfiguration(updated);
      setDraftProductId(updated.featuredProductId);
      setSaveState('success');
      setSaveMessage('Destaque salvo com sucesso. A página inicial já usará este produto.');
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Não foi possível salvar o destaque.');
    }
  };

  if (sessionState === 'checking') {
    return <main className="grid min-h-screen place-items-center bg-[#111111] text-white"><LoaderCircle className="h-7 w-7 animate-spin text-[#FF3B30]" aria-label="Verificando acesso" /></main>;
  }

  if (sessionState !== 'authenticated') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#111111] px-4 py-10 text-white">
        <section className="w-full max-w-md border-4 border-black bg-white p-7 text-black shadow-[9px_9px_0_0_#FF3B30]">
          <button onClick={onBackToStore} className="mb-7 inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-gray-600 hover:text-black"><ArrowLeft className="h-4 w-4" /> Voltar para a loja</button>
          <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#FF3B30] text-white"><LockKeyhole className="h-6 w-6" /></div>
          <h1 className="mt-5 font-display text-3xl font-black uppercase tracking-tighter">Painel administrativo</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">Acesso restrito para definir o produto em destaque na página inicial.</p>
          {sessionState === 'unavailable' ? (
            <div className="mt-6 border-2 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mb-2 h-5 w-5" />{authMessage}</div>
          ) : (
            <form onSubmit={signIn} className="mt-7 space-y-4">
              <label className="block font-mono text-[10px] font-black uppercase tracking-widest">Credencial administrativa
                <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full border-2 border-black px-3 py-3 text-sm outline-none focus:border-[#FF3B30]" placeholder="Informe a credencial segura" />
              </label>
              {authMessage && <p className="border-l-4 border-[#FF3B30] bg-red-50 p-3 text-xs font-semibold text-red-800">{authMessage}</p>}
              <button disabled={isAuthenticating} className="flex w-full items-center justify-center gap-2 border-2 border-black bg-black py-3.5 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-[#FF3B30] disabled:cursor-not-allowed disabled:bg-gray-500">
                {isAuthenticating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] pb-14 text-black">
      <header className="border-b-4 border-black bg-[#111111] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6"><div><span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#FF3B30]">Painel administrativo seguro</span><h1 className="font-display text-2xl font-black uppercase tracking-tighter">Destaque da página inicial</h1></div><div className="flex gap-3"><button onClick={onBackToStore} className="hidden border border-white/30 px-3 py-2 font-mono text-[10px] font-black uppercase sm:inline-flex">Ver loja</button><button onClick={signOut} className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-[#FF3B30]"><LogOut className="h-3.5 w-3.5" /> Sair</button></div></div></header>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          {configurationError && <div className="mb-6 flex gap-3 border-2 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{configurationError}</div>}
          {selectedWasRemoved && <div className="mb-6 flex gap-3 border-2 border-[#FF3B30] bg-red-50 p-4 text-sm text-red-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />O produto salvo não existe mais no catálogo. A home mostra o fallback neutro até você escolher e salvar outro destaque.</div>}
          <div className="border-2 border-black bg-white p-5 shadow-[5px_5px_0_0_#000]"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-display text-xl font-black uppercase">Escolha um produto do catálogo</h2><p className="mt-1 text-sm text-gray-600">A seleção sempre usa imagem, marca, categoria e disponibilidade reais da sincronização.</p></div><p className="font-mono text-[10px] font-black uppercase text-gray-500">{filteredProducts.length} de {products.length} produtos</p></div><div className="mt-5 grid gap-3 md:grid-cols-3"><label className="relative md:col-span-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar produto" className="w-full border-2 border-black py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF3B30]" /></label><select value={brand} onChange={(event) => setBrand(event.target.value)} className="border-2 border-black bg-white px-3 py-2.5 text-sm"><option value="todos">Todas as marcas</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={category} onChange={(event) => setCategory(event.target.value)} className="border-2 border-black bg-white px-3 py-2.5 text-sm"><option value="todos">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
          {catalogStatus !== 'ready' ? <div className="mt-6 border-2 border-dashed border-gray-400 bg-white p-10 text-center font-mono text-xs uppercase text-gray-500">Carregando catálogo sincronizado…</div> : <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => { const isCurrent = configuration?.featuredProductId === product.id; const isSelected = draftProductId === product.id; const sizes = availableSizes(product); return <article key={product.id} className={`overflow-hidden border-2 bg-white ${isSelected ? 'border-[#FF3B30] shadow-[4px_4px_0_0_#FF3B30]' : 'border-black'}`}><img src={product.images[0] || FALLBACK_IMAGE} alt={product.name} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} className="aspect-square w-full border-b-2 border-black object-cover" /><div className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-[#FF3B30]">{product.brand}</p><h3 className="mt-1 line-clamp-2 font-display text-base font-black uppercase leading-tight">{product.name}</h3></div>{isCurrent && <span className="shrink-0 bg-black px-2 py-1 font-mono text-[8px] font-black uppercase text-white">Atual</span>}</div><p className="mt-3 font-mono text-[9px] font-bold uppercase text-gray-500">Tamanhos: <span className="text-black">{sizes.length ? sizes.join(' · ') : 'Sob consulta'}</span></p><div className="mt-2 flex items-center justify-between gap-2"><span className={`font-mono text-[9px] font-black uppercase ${product.available ? 'text-green-700' : 'text-amber-700'}`}>{product.available ? 'Disponível' : 'Esgotado — sob encomenda'}</span><button onClick={() => { setDraftProductId(product.id); setSaveState('idle'); setSaveMessage(''); }} className={`border-2 px-2.5 py-2 font-mono text-[9px] font-black uppercase ${isSelected ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-black hover:bg-black hover:text-white'}`}>{isSelected ? 'Selecionado' : 'Definir como destaque'}</button></div></div></article>; })}</div>}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start"><BannerPreview product={selectedProduct} /><section className="border-2 border-black bg-white p-5 shadow-[5px_5px_0_0_#000]"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-700" /><h2 className="font-display text-lg font-black uppercase">Alteração</h2></div><p className="mt-3 text-sm text-gray-600">{selectedProduct ? <><strong>{selectedProduct.name}</strong> será usado no banner.</> : 'Escolha um produto na lista para visualizar a prévia.'}</p><p className="mt-2 font-mono text-[9px] font-bold uppercase leading-relaxed text-gray-500">Destaque atual: {savedProduct?.name ?? (selectedWasRemoved ? 'produto removido' : 'não definido')}<br />Atualizado: {formatUpdatedAt(configuration?.updatedAt ?? null)}</p><button onClick={saveFeaturedProduct} disabled={!selectedProduct || saveState === 'saving' || configurationError !== ''} className="mt-5 flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FF3B30] py-3.5 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-black disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"><Save className="h-4 w-4" />{saveState === 'saving' ? 'Salvando…' : 'Salvar alteração'}</button>{saveState !== 'idle' && <p className={`mt-4 flex gap-2 border-l-4 p-3 text-xs font-semibold ${saveState === 'success' ? 'border-green-600 bg-green-50 text-green-800' : saveState === 'error' ? 'border-[#FF3B30] bg-red-50 text-red-800' : 'border-gray-400 bg-gray-50 text-gray-700'}`}>{saveState === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}{saveMessage}</p>}</section></aside>
      </div>
    </main>
  );
}
