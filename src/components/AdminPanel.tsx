/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Star, Settings, Folder, Tag, Upload, 
  ArrowLeft, Check, Lock, Search, RefreshCw, X, ShieldAlert, Image, Save, HelpCircle
} from 'lucide-react';
import { 
  getProducts, saveProducts, addProduct, updateProduct, deleteProduct,
  getCategories, addCategory, deleteCategory,
  getBrands, addBrand, deleteBrand,
  getStoreConfig, saveStoreConfig, compressImageBase64, AdminProduct, AdminCategory, StoreConfig
} from '../utils/db';
import { FALLBACK_IMAGE } from '../data';
import type { Product } from '../types';

interface AdminPanelProps {
  onBackToStore: () => void;
  catalogProducts: Product[];
  onFeaturedProductChange: (productId: string) => void;
}

export default function AdminPanel({ onBackToStore, catalogProducts, onFeaturedProductChange }: AdminPanelProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pais_store_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'produtos' | 'categorias' | 'marcas' | 'config' | 'destaque'>('produtos');

  // DB States
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({ whatsappPhone: '', instagramLink: '', assistantWelcomeMsg: '' });

  // Filter and Search inside Admin
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('todos');

  // Modal / Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // New Product Form state
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: '',
    subCategory: 'Unissex' as 'Masculino' | 'Feminino' | 'Unissex' | 'Infantil',
    description: '',
    primaryImage: '',
    extraImagesText: '',
    sizesText: '',
    colorsText: '',
    badge: 'Por Encomenda' as any,
    isFeatured: false,
    isActive: true,
    catalogueTab: 'todos'
  });

  const [imageFileName, setImageFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Categories/Brands inputs
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [featuredBrand, setFeaturedBrand] = useState('todos');
  const [featuredCategory, setFeaturedCategory] = useState('todos');
  const [featuredDraftId, setFeaturedDraftId] = useState('');
  const [featuredMessage, setFeaturedMessage] = useState('');

  // Load Data
  const loadAllData = () => {
    setProducts(getProducts());
    setCategories(getCategories());
    setBrands(getBrands());
    const config = getStoreConfig();
    setStoreConfig(config);
    setFeaturedDraftId(config.featuredProductId ?? '');
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('pais_store_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Senha administrativa inválida. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pais_store_admin_auth');
    setPassword('');
  };

  // Product Actions
  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateProduct(id, { isActive: !currentStatus });
    loadAllData();
  };

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    updateProduct(id, { isFeatured: !currentFeatured });
    loadAllData();
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Você tem certeza de que deseja excluir o produto "${name}" permanentemente? This cannot be undone.`)) {
      deleteProduct(id);
      loadAllData();
    }
  };

  // Image upload compression handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setImageFileName(file.name);
      // Compress to avoid overloading localStorage
      const base64 = await compressImageBase64(file);
      setProductForm(prev => ({ ...prev, primaryImage: base64 }));
    } catch (err: any) {
      alert('Erro ao comprimir imagem: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  // Open Form to Add
  const handleOpenAddProduct = () => {
    const cats = getCategories().filter(c => c.id !== 'todos');
    const bds = getBrands();
    setEditingProduct(null);
    setImageFileName('');
    setProductForm({
      name: '',
      brand: bds[0] || 'Pais Store',
      category: cats[0]?.id || 'tenis',
      subCategory: 'Unissex',
      description: '',
      primaryImage: '',
      extraImagesText: '',
      sizesText: '37, 38, 39, 40, 41, 42, 43, 44',
      colorsText: 'Original, Preto, Branco',
      badge: 'Por Encomenda',
      isFeatured: false,
      isActive: true,
      catalogueTab: 'todos'
    });
    setIsProductModalOpen(true);
  };

  // Open Form to Edit
  const handleOpenEditProduct = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setImageFileName('');
    setProductForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category as string,
      subCategory: prod.subCategory,
      description: prod.description || '',
      primaryImage: prod.images[0] || '',
      extraImagesText: prod.images.slice(1).join(', '),
      sizesText: prod.sizes.join(', '),
      colorsText: prod.colors.join(', '),
      badge: prod.badge || 'Por Encomenda',
      isFeatured: !!prod.isFeatured,
      isActive: prod.isActive,
      catalogueTab: prod.catalogueTab || 'todos'
    });
    setIsProductModalOpen(true);
  };

  // Submit Product Form
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    // Convert strings to array arrays
    const parsedSizes = productForm.sizesText
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    const parsedColors = productForm.colorsText
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const extraImgs = productForm.extraImagesText
      .split(',')
      .map(img => img.trim())
      .filter(img => img.length > 0);

    const allImages = [productForm.primaryImage, ...extraImgs].filter(i => i.length > 0);

    const productPayload = {
      name: productForm.name.trim(),
      brand: productForm.brand,
      category: productForm.category as any,
      subCategory: productForm.subCategory,
      description: productForm.description.trim(),
      images: allImages,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['Sob Consulta'],
      colors: parsedColors.length > 0 ? parsedColors : ['Sob Consulta'],
      badge: productForm.badge,
      isFeatured: productForm.isFeatured,
      isActive: productForm.isActive,
      catalogueTab: productForm.catalogueTab
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsProductModalOpen(false);
    loadAllData();
  };

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryLabel.trim()) return;

    addCategory(newCategoryLabel.trim());
    setNewCategoryLabel('');
    loadAllData();
  };

  // Delete Category Handler
  const handleDeleteCategory = (id: string, label: string) => {
    if (id === 'todos' || id === 'tenis' || id === 'vestuario' || id === 'acessorios') {
      alert(`A categoria padrão "${label}" não pode ser excluída para garantir o funcionamento do catálogo.`);
      return;
    }
    if (window.confirm(`Excluir a categoria "${label}"? Produtos com esta categoria precisarão ser readequados.`)) {
      deleteCategory(id);
      loadAllData();
    }
  };

  // Add Brand Handler
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    addBrand(newBrandName.trim());
    setNewBrandName('');
    loadAllData();
  };

  // Delete Brand Handler
  const handleDeleteBrand = (name: string) => {
    if (window.confirm(`Remover a marca "${name}" dos filtros?`)) {
      deleteBrand(name);
      loadAllData();
    }
  };

  // Save Store config handler
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreConfig(storeConfig);
    alert('Configurações salvas com sucesso!');
    loadAllData();
  };

  const synchronizedProducts = catalogProducts.filter((product) => !product.archived);
  const featuredBrands = [...new Set(synchronizedProducts.map((product) => product.brand))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const featuredCategories = [...new Set(synchronizedProducts.map((product) => product.category))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const visibleFeaturedProducts = synchronizedProducts
    .filter((product) => {
      if (featuredBrand !== 'todos' && product.brand !== featuredBrand) return false;
      if (featuredCategory !== 'todos' && product.category !== featuredCategory) return false;
      const query = featuredSearch.trim().toLocaleLowerCase('pt-BR');
      return !query || `${product.name} ${product.brand} ${product.category}`.toLocaleLowerCase('pt-BR').includes(query);
    })
    .sort((left, right) => Number(right.available) - Number(left.available) || left.name.localeCompare(right.name, 'pt-BR'));
  const selectedFeaturedProduct = synchronizedProducts.find((product) => product.id === featuredDraftId) ?? null;
  const currentFeaturedProduct = synchronizedProducts.find((product) => product.id === storeConfig.featuredProductId) ?? null;

  const saveFeaturedHomeProduct = () => {
    if (!selectedFeaturedProduct) {
      setFeaturedMessage('Selecione um produto real do catálogo sincronizado antes de salvar.');
      return;
    }
    const nextConfig = { ...storeConfig, featuredProductId: selectedFeaturedProduct.id };
    saveStoreConfig(nextConfig);
    setStoreConfig(nextConfig);
    onFeaturedProductChange(selectedFeaturedProduct.id);
    setFeaturedMessage(`Destaque salvo: ${selectedFeaturedProduct.name}.`);
  };

  // Filter products for listing
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.brand.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCatFilter === 'todos' || p.category === productCatFilter;
    return matchesSearch && matchesCat;
  });

  // Render Login view if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute top-0 right-0 bg-[#FF3B30] text-white px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest border-l-2 border-b-2 border-black">
            ÁREA RESTRITA
          </div>

          <div className="mb-6 mt-2">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              PAIS STORE <span className="text-[#FF3B30]">ADMIN</span>
            </h1>
            <p className="text-xs text-gray-500 font-sans mt-1 leading-relaxed">
              Painel temporário para demonstração e cadastro fácil de catálogo.
            </p>
          </div>

          {/* Security Alert Banner */}
          <div className="bg-amber-50 border-2 border-amber-500/50 p-3.5 mb-6 text-amber-905 flex gap-3 rounded-none">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] font-sans leading-relaxed text-amber-800">
              <strong className="block uppercase tracking-wider text-amber-950 mb-0.5">AVISO DE SEGURANÇA:</strong>
              Este admin usa login simplificado e <code>localStorage</code> apenas para demonstração preliminar do catálogo. Para produção de grande escala, deve-se integrar autenticação real (ex: Firebase / Supabase).
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                SENHA ADMINISTRATIVA:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha do admin..."
                className="w-full rounded-none border-2 border-black bg-white px-3.5 py-2.5 text-xs font-bold focus:border-[#FF3B30] outline-none tracking-widest"
              />
              <p className="text-[10px] text-gray-400 mt-1">Dica de teste: <code className="font-bold text-black border px-1">admin123</code></p>
            </div>

            {authError && (
              <p className="text-xs text-[#FF3B30] font-bold bg-red-50 p-2 border border-red-200">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-black hover:bg-red-650 text-white font-black uppercase tracking-widest text-[11px] px-4 py-3 border-2 border-black hover:bg-[#FF3B30] transition-all cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              ENTRAR NO PAINEL
            </button>
          </form>

          <button
            onClick={onBackToStore}
            className="w-full mt-4 text-center text-xs font-bold text-gray-650 hover:text-black hover:underline cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o catálogo público
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between antialiased">
      {/* Admin Top Header bar */}
      <header className="bg-black text-white py-4 px-6 sticky top-0 z-30 flex items-center justify-between border-b-2 border-black">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            PAIS STORE <span className="text-[#FF3B30] text-sm font-mono border border-red-500/80 px-2 py-0.5">ADMIN PANEL</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStore}
            className="bg-neutral-900 border border-neutral-700 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 transition-all hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            VOLTAR AO SITE
          </button>

          <button
            onClick={handleLogout}
            className="bg-[#FF3B30] text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 transition-all hover:bg-red-800 cursor-pointer"
          >
            SAIR
          </button>
        </div>
      </header>

      {/* Main Admin View Workspace */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 space-y-3">
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1.5">
            <span className="font-mono text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1 border-b pb-1">
              GERENCIAMENTO
            </span>

            <button
              onClick={() => setActiveTab('produtos')}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'produtos' 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Plus className="h-4 w-4" />
              Produtos
            </button>

            <button
              onClick={() => setActiveTab('categorias')}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'categorias' 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Folder className="h-4 w-4" />
              Categorias / Abas
            </button>

            <button
              onClick={() => setActiveTab('marcas')}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'marcas' 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Tag className="h-4 w-4" />
              Marcas
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'config' 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              Configuração Geral
            </button>

            <button
              onClick={() => setActiveTab('destaque')}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                activeTab === 'destaque'
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Star className="h-4 w-4" />
              Destaque da home
            </button>
          </div>

          {/* Quick Demo Info block */}
          <div className="bg-amber-50 border-2 border-amber-500/20 p-4 shadow-[4px_4px_0px_0px_rgba(245,158,11,0.15)] text-[11px] leading-relaxed text-amber-800">
            <span className="font-bold text-amber-900 block uppercase mb-1">ℹ️ AMBIENTE DEMO</span>
            Como este catálogo é baseado no <strong>localStorage</strong>, todas as suas alterações se aplicam instantaneamente ao seu navegador atual e catálogo público. Perfeito para testes e simulações rápidas com o cliente!
          </div>
        </aside>

        {/* Tab content wrapper panel */}
        <section className="lg:col-span-3 space-y-6">

          {/* TAB 1: PRODUCTS MANAGER */}
          {activeTab === 'produtos' && (
            <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-black">
                    PRODUTOS CADASTRADOS
                  </h2>
                  <p className="text-xs text-gray-500">
                    Clique em cadastrar para incluir fotos de sneaker, vestuários ou acessórios.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="bg-black hover:bg-[#FF3B30] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  CADASTRAR PRODUTO
                </button>
              </div>

              {/* Advanced search and category filtering in list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou marca..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-gray-55 border-2 border-black rounded-none py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#FF3B30] uppercase font-bold text-black"
                  />
                </div>

                <div>
                  <select
                    value={productCatFilter}
                    onChange={(e) => setProductCatFilter(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-none py-2 px-3 text-xs outline-none focus:border-[#FF3B30] font-bold text-black"
                  >
                    <option value="todos">TODAS AS CATEGORIAS</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table listings */}
              {filteredProducts.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 py-12 text-center text-xs text-gray-500 uppercase font-mono">
                  Nenhum produto correspondente aos filtros.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-black font-black uppercase text-gray-700 tracking-wider">
                        <th className="p-3">Foto</th>
                        <th className="p-3">Nome / Detalhes</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Marca</th>
                        <th className="p-3 text-center">Destaque</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 group font-sans">
                          {/* Photo column */}
                          <td className="p-3">
                            <div className="h-12 w-12 bg-gray-100 border border-black overflow-hidden flex items-center justify-center shrink-0">
                              <img 
                                src={p.images[0] || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100&auto=format&fit=crop&q=80'} 
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100&auto=format&fit=crop&q=80';
                                }}
                              />
                            </div>
                          </td>
                          {/* Name details */}
                          <td className="p-3">
                            <div className="font-bold text-gray-900 uppercase tracking-tight">{p.name}</div>
                            <div className="text-[10px] text-gray-500 flex flex-wrap gap-1.5 mt-1 items-center font-mono">
                              <span className="bg-gray-150 px-1.5 py-0.5">{p.subCategory}</span>
                              {p.badge && <span className="bg-[#FF3B30]/10 text-[#FF3B30] font-black px-1.5 py-0.5">{p.badge}</span>}
                              {p.catalogueTab && <span className="bg-blue-50 text-blue-700 border border-blue-105 px-1.5 py-0.5">Aba: {p.catalogueTab}</span>}
                            </div>
                          </td>
                          <td className="p-3 uppercase font-mono font-bold text-[10px]">
                            {categories.find(c => c.id === p.category)?.label || p.category}
                          </td>
                          <td className="p-3 font-bold text-black">{p.brand}</td>
                          
                          {/* Toggle Featured */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleFeatured(p.id, !!p.isFeatured)}
                              title="Alternar se o item merece destaque na seção de Mais Pedidos"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                p.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-gray-400'
                              }`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                          </td>

                          {/* Toggle status (Active / Inactive) */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleActive(p.id, p.isActive)}
                              className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase border rounded transition-all cursor-pointer ${
                                p.isActive 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                              title={p.isActive ? 'Esconder item do catálogo de clientes' : 'Exibir item aos clientes'}
                            >
                              {p.isActive ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>

                          {/* Actions column */}
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              title="Editar Produto"
                              className="p-1 px-2.5 bg-gray-100 hover:bg-black hover:text-white border border-black cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Excluir Produto"
                              className="p-1 px-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Del
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {/* TAB 2: CATEGORIES & TABS MANAGER */}
          {activeTab === 'categorias' && (
            <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-8">
              
              {/* Category CRUD part */}
              <div>
                <h2 className="font-display text-lg font-black uppercase tracking-tight text-black mb-3 pb-2 border-b">
                  CATEGORIAS DO CATÁLOGO
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Adicione e configure categorias secundárias para o menu de abas principal.
                </p>

                {/* Form to add Category */}
                <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md mb-6">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Puffer Jackets, Bonés, Jaquetas..."
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    className="flex-1 bg-white border-2 border-black px-3 py-2 text-xs font-bold outline-none focus:border-[#FF3B30] uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-[#FF3B30] text-white border-2 border-black px-4 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                  >
                    Adicionar
                  </button>
                </form>

                {/* Current Category Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map(c => {
                    const isSystemReserved = ['todos', 'tenis', 'vestuario', 'acessorios'].includes(c.id);
                    return (
                      <div key={c.id} className="flex items-center justify-between border-2 border-black p-3 bg-[#fafafa]">
                        <div>
                          <p className="text-xs font-bold uppercase text-black">{c.label}</p>
                          <p className="font-mono text-[9px] text-gray-400">ID Filtragem: {c.id}</p>
                        </div>

                        {!isSystemReserved ? (
                          <button
                            onClick={() => handleDeleteCategory(c.id, c.label)}
                            className="text-rose-600 hover:text-red-700 font-mono text-[10px] font-bold uppercase hover:underline"
                          >
                            Excluir
                          </button>
                        ) : (
                          <span className="font-mono text-[9px] font-black text-gray-400 uppercase bg-gray-200 px-1.5 py-0.5 rounded-none select-none">
                            Sistema
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informative catalog tags panel */}
              <div className="bg-neutral-50 p-5 border-2 border-neutral-300">
                <h3 className="font-display text-sm font-black text-black uppercase mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-neutral-600" />
                  ENTENDENDO AS ABAS/FILTROS DO CATÁLOGO
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  Quando você cadastra ou edita um produto, você pode associá-lo a uma das seções estruturais do catálogo público como:
                </p>
                <ul className="text-xs text-neutral-600 list-disc pl-5 mt-2 space-y-1 font-mono">
                  <li><strong>Lançamentos (<code>lancamentos</code>)</strong>: O produto aparecerá imediatamente com prioridade na paginação de novos itens.</li>
                  <li><strong>Mais Pedidos (<code>mais-pedidos</code>)</strong>: O produto aparecerá na recomendação principal escura e em destaque.</li>
                  <li><strong>Sob Encomenda (<code>sob-encomenda</code>)</strong>: Típico para itens importados sob especificação e consulta.</li>
                </ul>
              </div>

            </div>
          )}


          {/* TAB 3: BRANDS MANAGER */}
          {activeTab === 'marcas' && (
            <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-black mb-3 pb-2 border-b">
                GERENCIAR MARCAS DO CATÁLOGO
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Marcas cadastradas aqui alimentam automaticamente a barra suspensa de filtros rápidos do catálogo principal.
              </p>

              {/* Form to add Brand */}
              <form onSubmit={handleAddBrand} className="flex gap-2 max-w-md mb-6">
                <input
                  type="text"
                  required
                  placeholder="Ex: Nike, Jordan, Supreme, Yeezy, Adidas..."
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="flex-1 bg-white border-2 border-black px-3 py-2 text-xs font-bold outline-none focus:border-[#FF3B30] uppercase"
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-[#FF3B30] text-white border-2 border-black px-4 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                >
                  Adicionar
                </button>
              </form>

              {/* Brands Grid lists */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {brands.map(brand => (
                  <div key={brand} className="flex items-center justify-between border-2 border-black px-3 py-2 bg-white hover:bg-neutral-50 transition-colors">
                    <span className="text-xs font-bold text-black uppercase">{brand}</span>
                    <button
                      onClick={() => handleDeleteBrand(brand)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title={`Remover marca ${brand}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* TAB 4: GENERAL STORE CONFIG */}
          {activeTab === 'config' && (
            <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-black mb-3 pb-2 border-b">
                CONFIGURAÇÃO GERAL DA PAIS STORE
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Atualize as informações de redirecionamento, WhatsApp Oficial de atendimento e links do Instagram.
              </p>

              <form onSubmit={handleSaveConfig} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    WHATSAPP OFICIAL (APENAS NÚMEROS):
                  </label>
                  <input
                    type="text"
                    required
                    value={storeConfig.whatsappPhone}
                    onChange={(e) => setStoreConfig(prev => ({ ...prev, whatsappPhone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Ex: 5551985758791"
                    className="w-full rounded-none border-2 border-black bg-white px-3.5 py-2.5 text-xs font-bold focus:border-[#FF3B30] outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Insira em formato internacional: DDI (55) + DDD (51) + Número. Atual: <code className="font-bold text-black">{storeConfig.whatsappPhone}</code>
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    LINK DO INSTAGRAM DA LOJA:
                  </label>
                  <input
                    type="url"
                    required
                    value={storeConfig.instagramLink}
                    onChange={(e) => setStoreConfig(prev => ({ ...prev, instagramLink: e.target.value }))}
                    placeholder="Ex: https://www.instagram.com/paisstoreoficial"
                    className="w-full rounded-none border-2 border-black bg-white px-3.5 py-2.5 text-xs font-bold focus:border-[#FF3B30] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    MENSAGEM AUTOMÁTICA PRINCIPAL:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={storeConfig.assistantWelcomeMsg}
                    onChange={(e) => setStoreConfig(prev => ({ ...prev, assistantWelcomeMsg: e.target.value }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3.5 py-2.5 text-xs font-bold focus:border-[#FF3B30] outline-none resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Esta mensagem é o texto de boas-vindas padrão adicionado nos links flutuantes gerais de atendimento.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-black hover:bg-[#FF3B30] text-white border-2 border-black text-xs font-black uppercase tracking-widest px-6 py-3 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                  >
                    SALVAR TODAS AS CONFIGURAÇÕES
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'destaque' && (
            <div className="space-y-6">
              <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-display text-xl font-black uppercase tracking-tight text-black">Produto em destaque na página inicial</h2>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">Escolha um produto real do catálogo sincronizado. A marca, categoria e imagem do banner serão atualizadas automaticamente.</p>
                  </div>
                  {currentFeaturedProduct ? <span className="shrink-0 border-2 border-green-700 bg-green-50 px-2.5 py-1 font-mono text-[9px] font-black uppercase text-green-800">Atual: {currentFeaturedProduct.name}</span> : <span className="shrink-0 border-2 border-amber-500 bg-amber-50 px-2.5 py-1 font-mono text-[9px] font-black uppercase text-amber-800">Sem destaque salvo</span>}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={featuredSearch} onChange={(event) => setFeaturedSearch(event.target.value)} placeholder="Buscar por nome" className="w-full border-2 border-black py-2.5 pl-9 pr-3 text-xs font-bold uppercase outline-none focus:border-[#FF3B30]" /></label>
                  <select value={featuredBrand} onChange={(event) => setFeaturedBrand(event.target.value)} className="border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase outline-none focus:border-[#FF3B30]"><option value="todos">Todas as marcas</option>{featuredBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select>
                  <select value={featuredCategory} onChange={(event) => setFeaturedCategory(event.target.value)} className="border-2 border-black bg-white px-3 py-2.5 text-xs font-bold uppercase outline-none focus:border-[#FF3B30]"><option value="todos">Todas as categorias</option>{featuredCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleFeaturedProducts.map((product) => {
                    const availableSizes = [...new Set(product.variants.filter((variant) => variant.available).map((variant) => variant.size))];
                    const selected = featuredDraftId === product.id;
                    const current = storeConfig.featuredProductId === product.id;
                    return (
                      <article key={product.id} className={`overflow-hidden border-2 bg-white ${selected ? 'border-[#FF3B30] shadow-[4px_4px_0_0_#FF3B30]' : 'border-black'}`}>
                        <img src={product.images[0] || FALLBACK_IMAGE} alt={product.name} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} className="aspect-square w-full border-b-2 border-black object-cover" />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2"><div><p className="font-mono text-[9px] font-black uppercase tracking-widest text-[#FF3B30]">{product.brand}</p><h3 className="mt-1 line-clamp-2 font-display text-sm font-black uppercase leading-tight">{product.name}</h3></div>{current && <span className="bg-black px-1.5 py-1 font-mono text-[8px] font-black uppercase text-white">Atual</span>}</div>
                          <p className="mt-3 font-mono text-[9px] font-bold uppercase leading-relaxed text-gray-600">Tamanhos disponíveis: <span className="text-black">{availableSizes.length ? availableSizes.join(' · ') : 'Sob consulta'}</span></p>
                          <p className={`mt-1 font-mono text-[9px] font-black uppercase ${product.available ? 'text-green-700' : 'text-amber-700'}`}>{product.available ? 'Disponível' : 'Esgotado — sob encomenda'}</p>
                          <button onClick={() => { setFeaturedDraftId(product.id); setFeaturedMessage(''); }} className={`mt-3 w-full border-2 py-2 font-mono text-[9px] font-black uppercase ${selected ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-black hover:bg-black hover:text-white'}`}>{selected ? 'Selecionado' : 'Definir como destaque'}</button>
                        </div>
                      </article>
                    );
                  })}
                  {!visibleFeaturedProducts.length && <p className="border-2 border-dashed border-gray-300 p-8 text-center font-mono text-xs uppercase text-gray-500 sm:col-span-2 xl:col-span-3">Nenhum produto encontrado no catálogo sincronizado.</p>}
                </div>

                <aside className="h-fit border-2 border-black bg-white p-5 shadow-[5px_5px_0_0_#000] xl:sticky xl:top-5">
                  <h3 className="font-display text-lg font-black uppercase">Prévia do banner</h3>
                  <div className="relative mt-4 flex h-56 items-center justify-center border-4 border-black bg-[#111111] p-4">
                    <div className="absolute inset-0 border-2 border-dashed border-white/10" />
                    <img src={selectedFeaturedProduct?.images[0] || FALLBACK_IMAGE} alt={selectedFeaturedProduct?.name || 'Prévia neutra'} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} className="relative z-10 h-[115%] w-[115%] rotate-[-15deg] object-contain drop-shadow-[0_16px_16px_rgba(255,59,48,0.3)]" />
                    <span className="absolute -top-3 right-2 z-20 border-2 border-[#FF3B30] bg-black px-2 py-1 font-mono text-[8px] font-black uppercase text-[#FF3B30]"># {selectedFeaturedProduct?.brand || 'Catálogo'}</span>
                    <span className="absolute -bottom-3 left-2 z-20 border-2 border-white bg-black px-2 py-1 font-mono text-[8px] font-black uppercase text-white"># {selectedFeaturedProduct?.category || 'Pais Store'}</span>
                  </div>
                  <p className="mt-6 text-xs leading-relaxed text-gray-600">{selectedFeaturedProduct ? <><strong>{selectedFeaturedProduct.name}</strong> aparecerá na home.</> : 'Escolha um produto para visualizar antes de salvar.'}</p>
                  <button disabled={!selectedFeaturedProduct} onClick={saveFeaturedHomeProduct} className="mt-5 flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FF3B30] py-3 font-mono text-xs font-black uppercase tracking-widest text-white hover:bg-black disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"><Save className="h-4 w-4" />Salvar alteração</button>
                  {featuredMessage && <p className="mt-4 border-l-4 border-green-600 bg-green-50 p-3 text-xs font-bold text-green-800">{featuredMessage}</p>}
                  <p className="mt-4 border-t pt-3 font-mono text-[9px] uppercase leading-relaxed text-gray-500">A seleção é salva no armazenamento local do painel original. Ela permanece neste navegador, mas não é compartilhada entre dispositivos ou após limpar os dados do site.</p>
                </aside>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* FOOTER NOTIFY */}
      <footer className="bg-neutral-100 border-t border-neutral-300 py-4 text-center mt-12 select-none">
        <p className="text-[10px] uppercase font-mono font-bold text-neutral-500">
          PAIS STORE OFICIAL — AMBIENTE DE CONTROLE INTEGRADO LOCALSTORE
        </p>
      </footer>


      {/* SNEAKER/PRODUCT POPUP DIALOG FORM FOR ADD/EDIT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto min-h-screen">
          <div className="w-full max-w-2xl bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8">
            
            {/* Header Dialog */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
              <h3 className="font-display text-base font-black uppercase tracking-tight text-black">
                {editingProduct ? 'EDITAR PRODUTO DOCATÁLOGO' : 'CADASTRAR NOVO PRODUTO'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-black hover:rotate-90 transition-transform duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Fields Form */}
            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              {/* Product title name */}
              <div>
                <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                  NOME COMPLETO DO PRODUTO <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Air Jordan 1 Retro Low OG Neutral Grey"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase focus:border-[#FF3B30] outline-none"
                />
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand Selector */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                    MARCA DO SNEAKER/VESTUÁRIO <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black uppercase"
                  >
                    {brands.map(b => (
                      <option key={b} value={b}>{b.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                    CATEGORIA <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black uppercase"
                  >
                    {categories.filter(oc => oc.id !== 'todos').map(c => (
                      <option key={c.id} value={c.id}>{c.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sub category / Segment */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                    GÊNERO / SEGMENTO <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select
                    value={productForm.subCategory}
                    onChange={(e) => setProductForm(prev => ({ ...prev, subCategory: e.target.value as any }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black uppercase"
                  >
                    <option value="Unissex">UNISSEX</option>
                    <option value="Masculino">MASCULINO</option>
                    <option value="Feminino">FEMININO</option>
                    <option value="Infantil">INFANTIL</option>
                  </select>
                </div>

                {/* Catalogue Tab Placement */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                    ABA DO CATALOGO <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select
                    value={productForm.catalogueTab}
                    onChange={(e) => setProductForm(prev => ({ ...prev, catalogueTab: e.target.value }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black uppercase"
                  >
                    <option value="todos">Catalogo Geral (Todos)</option>
                    <option value="lancamentos">Lançamentos</option>
                    <option value="mais-pedidos">Mais Pedidos</option>
                    <option value="sob-encomenda">Sob Encomenda</option>
                  </select>
                </div>
              </div>

              {/* Photo Input options */}
              <div className="bg-gray-50 p-4 border border-dashed border-gray-300">
                <span className="block text-[9px] font-black text-black uppercase tracking-widest mb-1.5">
                  FOTO OU IMAGEM DO PRODUTO:
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text link source code input */}
                  <div>
                    <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      OPÇÃO A: CAMINHO DA IMAGEM OU LINK DIRETO (RECOMENDADO)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: /produtos/tenis-01.jpg ou link da web"
                      value={productForm.primaryImage}
                      onChange={(e) => setProductForm(prev => ({ ...prev, primaryImage: e.target.value }))}
                      className="w-full rounded-none border border-black bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  {/* Upload file code input */}
                  <div>
                    <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      OPÇÃO B: ENVIAR FOTO DO COMPUTADOR (CONVERTE PARA BASE64)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="bg-black hover:bg-[#FF3B30] text-white px-3 py-1.5 border border-black text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        Escolher Arquivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                        {isCompressing ? 'Comprimindo...' : imageFileName || 'Nenhum selecionado'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 mt-2 font-sans">
                  * <strong>Nota de Demonstração</strong>: O upload comprime a imagem automaticamente no navegador para preservar o limite de armazenamento local temporário (localStorage).
                </p>
              </div>

              {/* Additional parameters input line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Available Sizes list input separated by comma */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                    TAMANHOS DISPONÍVEIS (SEPARADOS POR VÍRGULA):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 38, 39, 40, 41, 42, 43, 44"
                    value={productForm.sizesText}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sizesText: e.target.value }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase focus:border-[#FF3B30] outline-none"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">Deixe em branco para preencher com "Sob Consulta".</p>
                </div>

                {/* Colors available list input separated by comma */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                    CORES DISPONÍVEIS (SEPARADOS POR VÍRGULA):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Chicago Red, Off-White, Triple Black"
                    value={productForm.colorsText}
                    onChange={(e) => setProductForm(prev => ({ ...prev, colorsText: e.target.value }))}
                    className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase focus:border-[#FF3B30] outline-none"
                  />
                </div>
              </div>

              {/* Extra images separated by comma */}
              <div>
                <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                  FOTOS EXTRAS OU DETALHAMENTO DE ÂNGULOS (LINKS DA WEB SEPARADOS POR VÍRGULA):
                </label>
                <input
                  type="text"
                  placeholder="Ex: /produtos/tenis-01-lateral.jpg, /produtos/tenis-01-traseira.jpg"
                  value={productForm.extraImagesText}
                  onChange={(e) => setProductForm(prev => ({ ...prev, extraImagesText: e.target.value }))}
                  className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold"
                />
              </div>

              {/* Description text field */}
              <div>
                <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1">
                  DESCRIÇÃO CURTA DO PRODUTO (RECOMENDADO DETALHAR QUALIDADE):
                </label>
                <textarea
                  rows={2}
                  placeholder="Fale sobre os materiais, sola acolchoada, caimento da peça, estilo e sugestões de tamanhos recomendados."
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:border-[#FF3B30] outline-none resize-none"
                />
              </div>

              {/* Status checkboxes line */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                
                {/* Badge selection */}
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-widest mb-1.5">
                    BADGE / SELO DE CATÁLOGO:
                  </label>
                  <select
                    value={productForm.badge}
                    onChange={(e) => setProductForm(prev => ({ ...prev, badge: e.target.value as any }))}
                    className="w-full rounded-none border-2 border-black bg-white px-2 py-1.5 text-xs font-bold"
                  >
                    <option value="Por Encomenda">Por Encomenda</option>
                    <option value="Lançamento">Lançamento</option>
                    <option value="Mais Pedido">Mais Pedido</option>
                    <option value="Coleção Premium">Coleção Premium</option>
                    <option value="Sob consulta">Sob Consulta</option>
                  </select>
                </div>

                {/* Featured item click */}
                <div className="flex items-center gap-2 pt-5 select-none">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 bg-white border-2 border-black text-black focus:ring-0 cursor-pointer accent-black"
                  />
                  <label htmlFor="isFeatured" className="text-[10px] font-black text-black uppercase tracking-widest cursor-pointer">
                    MARCAR DESTAQUE (MAIS PEDIDO)
                  </label>
                </div>

                {/* Active check */}
                <div className="flex items-center gap-2 pt-5 select-none">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 bg-white border-2 border-black text-black focus:ring-0 cursor-pointer accent-black"
                  />
                  <label htmlFor="isActive" className="text-[10px] font-black text-black uppercase tracking-widest cursor-pointer">
                    PRODUTO ATIVO NO SITE
                  </label>
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black mt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-black text-xs font-black uppercase tracking-widest px-4 py-2.5 border-2 border-black"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="bg-black hover:bg-[#FF3B30] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-0.5 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  SALVAR PRODUTO
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}
