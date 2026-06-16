/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

/**
 * PAIS STORE OFICIAL - PRODUTOS DO CATÁLOGO
 * 
 * Se você tiver as URLs diretas das fotos do Instagram, ou se quiser carregar
 * imagens na pasta public e linkar como "/imagens/produto.jpg", basta alterar 
 * os links no campo 'images' abaixo.
 */
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'nike-dunk-low-panda',
    name: 'Nike Dunk Low Panda Premium',
    brand: 'Nike',
    category: 'tenis',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/nike_dunk_panda_1781632831451.jpg'
    ],
    description: 'O sneaker mais versátil do streetwear mundial. Com construção em couro premium e contraste clássico em preto e branco (Panda), é a escolha perfeita para qualquer ocasião e visual.',
    sizes: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
    colors: ['Preto/Branco (Panda)', 'Branco Total', 'Cinza/Preto'],
    badge: 'Por Encomenda',
    isFeatured: true
  },
  {
    id: 'air-jordan-1-retro-chicago',
    name: 'Air Jordan 1 Retro Chicago Lost & Found',
    brand: 'Jordan',
    category: 'tenis',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/jordan_1_chicago_1781632853059.jpg'
    ],
    description: 'Revivendo a era dourada do basquete. O Air Jordan 1 Chicago Lost & Found traz o visual vintage clássico do modelo de 1985, com acabamento texturizado imitando couro envelhecido de época e caixa retrô.',
    sizes: ['37', '38', '39', '40', '41', '42', '43', '44'],
    colors: ['Chicago Red (Vermelho/Preto/Branco)', 'Shadow (Cinza/Preto)', 'Obsidian (Branco/Azul Escuro)'],
    badge: 'Por Encomenda',
    isFeatured: true
  },
  {
    id: 'yeezy-boost-350-v2-onyx',
    name: 'Adidas Yeezy Boost 350 V2 Onyx',
    brand: 'Adidas',
    category: 'tenis',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/yeezy_onyx_1781632868513.jpg'
    ],
    description: 'Design futurista com conforto incomparável. Tecido Primeknit flexível que se adapta perfeitamente ao pé, complementado pela sola equipada com a tecnologia de amortecimento original Adidas Boost.',
    sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    colors: ['Onyx (Preto Carbono)', 'Bone (Off-White)', 'Zebra (Branco/Preto Stripes)'],
    badge: 'Por Encomenda',
    isFeatured: true
  },
  {
    id: 'new-balance-550-white-green',
    name: 'New Balance 550 White Green',
    brand: 'New Balance',
    category: 'tenis',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/nb_550_green_1781632879720.jpg'
    ],
    description: 'Originalmente de 1989, o NB 550 redefiniu a cena urbana global. Silhueta retrô de quadra de basquete com couro perfurado extremamente durável e detalhes vibrantes em verde floresta acadêmico.',
    sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43'],
    colors: ['White Forest Green (Verde/Branco)', 'White Navy Blue (Azul/Branco)', 'White Orewood (Creme)'],
    badge: 'Por Encomenda',
    isFeatured: false
  },
  {
    id: 'essentials-hoodie-fear-of-god',
    name: 'Moletom Fear of God Essentials Oversized',
    brand: 'Essentials',
    category: 'roupas',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/essentials_hoodie_1781632893715.jpg'
    ],
    description: 'Modelagem perfeitamente estruturada e minimalista da lendária Fear of God. Tecido pesado, felpado e ultra macio, com as clássicas estampas aplicadas em silicone de alta densidade no capuz e peito.',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Bege Khaki', 'Preto Matte', 'Cinza Mescla', 'Sage Green'],
    badge: 'Por Encomenda',
    isFeatured: true
  },
  {
    id: 'supreme-box-logo-tee',
    name: 'Camiseta Supreme Box Logo Classic',
    brand: 'Supreme',
    category: 'roupas',
    subCategory: 'Masculino',
    images: [
      '/src/assets/images/supreme_bogo_tee_1781632906526.jpg'
    ],
    description: 'A camiseta mais icônica do streetwear global. Modelagem box fit reta, confeccionada em algodão pesado 100% americano para caimento perfeito e extrema durabilidade do tecido.',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: ['Branco com Box Logo Vermelho', 'Preto Total', 'Cinza com Box Logo Vermelho'],
    badge: 'Por Encomenda',
    isFeatured: false
  },
  {
    id: 'cargo-pants-streetwear-black',
    name: 'Calça Cargo Streetwear Heavy Twill',
    brand: 'Pais Store',
    category: 'roupas',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/cargo_pants_1781632916805.jpg'
    ],
    description: 'Calça cargo com caimento largo (baggy fit) em sarja de alta gramatura. Possui 6 bolsos funcionais reforçados e reguladores de fivela metálica na cintura e tornozelo para modelagem personalizada.',
    sizes: ['38', '40', '42', '44', '46'],
    colors: ['Preto Carbono', 'Verde Militar', 'Marrom Chocolate', 'Bege Areia'],
    badge: 'Por Encomenda',
    isFeatured: false
  },
  {
    id: 'supreme-puffer-jacket',
    name: 'Jaqueta Puffer Termorreguladora Streetwear',
    brand: 'Supreme',
    category: 'roupas',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/puffer_jacket_1781632929733.jpg'
    ],
    description: 'Enfrente dias frios com o máximo de estilo urbano. Jaqueta acolchoada de alta densidade revestida com acabamento externo impermeabilizado que protege de chuvas finas, detalhado com lettering minimalista.',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Preto Brás', 'Vermelho Heritage', 'Verde Cyberpunk'],
    badge: 'Por Encomenda',
    isFeatured: true
  },
  {
    id: 'classic-streetwear-cap',
    name: 'Boné Strapback Curved Peak Old School',
    brand: 'Pais Store',
    category: 'acessorios',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/supreme_cap_washed_1781632947524.jpg'
    ],
    description: 'O boné clássico com lavagem especial estonada (vintage washed). Aba curva perfeita, costuras reforçadas e fecho strapback de couro legítimo com fivela de latão envelhecido.',
    sizes: ['Tamanho Único (Ajustável)'],
    colors: ['Preto Estonado', 'Azul Marinho Vintage', 'Verde Musgo', 'Vinho Burgandy'],
    badge: 'Por Encomenda',
    isFeatured: false
  },
  {
    id: 'crossbody-street-bag',
    name: 'Shoulder Bag / Crossbody Utility Pack',
    brand: 'Nike',
    category: 'acessorios',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/crossbody_bag_1781632959871.jpg'
    ],
    description: 'Leve seus itens essenciais com segurança em grande estilo. Construção robusta em poliéster balístico Ripstop contra rasgos, alça tiracolo regulável removível e divisórias internas inteligentes.',
    sizes: ['Tamanho Único'],
    colors: ['Preto Total', 'Branco Off', 'Laranja Street'],
    badge: 'Por Encomenda',
    isFeatured: false
  },
  {
    id: 'street-sunglasses-90s',
    name: 'Óculos de Sol Retro Streetwear Oval',
    brand: 'Pais Store',
    category: 'acessorios',
    subCategory: 'Unissex',
    images: [
      '/src/assets/images/retro_sunglasses_90s_1781632972063.jpg'
    ],
    description: 'Inspirado na icônica estética retro dos anos 90 e alta moda streetwear. Lentes ovais pretas com 100% de proteção contra raios UVA/UVB e armação de acetato resistente de toque premium.',
    sizes: ['Tamanho Único'],
    colors: ['Preto / Lente Preta', 'Tartaruga / Lente Marrom', 'Branco / Lente Preta'],
    badge: 'Por Encomenda',
    isFeatured: false
  }
];

export const BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Supreme', 'Essentials', 'Pais Store'];

export const CATEGORIES = [
  { id: 'todos', label: 'Todos os Produtos' },
  { id: 'tenis', label: 'Tênis / Sneakers' },
  { id: 'roupas', label: 'Vestuário / Roupas' },
  { id: 'acessorios', label: 'Acessórios / Outros' }
];

export const SUBCATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'Masculino', label: 'Masculino' },
  { id: 'Feminino', label: 'Feminino' },
  { id: 'Unissex', label: 'Unissex' }
];

export const WHATSAPP_PHONE = '5551985758791'; // Número oficial em formato de consulta DDI+DDD+Número
export const INSTAGRAM_LINK = 'https://www.instagram.com/paisstoreoficial';
export const WHATSAPP_WELCOME_MSG = 'Olá! Gostaria de consultar a disponibilidade de um produto da Pais Store.';
