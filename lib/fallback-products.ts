import type { Product, Variant } from '@/types';

// Espejo de supabase/seed_real.sql.
// Permite correr `npm run dev` sin credenciales de Supabase.
const v = (precio5: number, precioBolsa: number): Variant[] => [
  { id: '5kg', label: '5 kg', tipo: 'precio', precio: precio5, peso_kg: 5 },
  { id: 'bolsa', label: 'Bulto Cerrado', tipo: 'precio', precio: precioBolsa, peso_kg: 10 },
  { id: 'mayorista', label: '+5 bultos (Consultar)', tipo: 'consultar', precio: null, peso_kg: 50 },
];

type Seed = [
  slug: string,
  nombre: string,
  descripcion: string,
  imagen_url: string,
  categoria: string,
  precio5: number,
  precioBolsa: number,
];

const SEED: Seed[] = [
  [
    'nuez-mariposa-light',
    'Nuez Mariposa Light',
    'Nuez pelada mitad mariposa, color light. Calibre extra, cosecha del año.',
    'https://images.unsplash.com/photo-1590082871875-06428eb31464?w=500',
    'frutos-secos',
    45000,
    85000,
  ],
  [
    'almendra-guara',
    'Almendra Guara',
    'Almendra Guara sin cáscara, origen nacional. Grano parejo y crocante.',
    'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500',
    'frutos-secos',
    52000,
    98000,
  ],
  [
    'castanas-caju-w4',
    'Castañas de Cajú W4',
    'Cajú entero calibre W4, tostado natural sin sal. Alta rotación en góndola.',
    'https://images.unsplash.com/photo-1627993427389-bb01c37c2299?w=500',
    'frutos-secos',
    60000,
    115000,
  ],
  [
    'mix-tropical',
    'Mix Tropical',
    'Mezcla de frutas desecadas tropicales y frutos secos. Listo para fraccionar.',
    'https://images.unsplash.com/photo-1599577180579-24231b539da6?w=500',
    'mixes',
    28000,
    52000,
  ],
  [
    'pasas-uva-morocha',
    'Pasas de Uva Morocha',
    'Pasa morocha sin semilla, húmeda y flexible. Ideal panificación y repostería.',
    'https://images.unsplash.com/photo-1604924760233-255e2d83296c?w=500',
    'secos',
    15000,
    28000,
  ],
];

export const FALLBACK_PRODUCTS: Product[] = SEED.map(
  ([slug, nombre, descripcion, imagen_url, categoria, p5, pb], i) => ({
    id: `local-${slug}`,
    slug,
    nombre,
    descripcion,
    imagen_url,
    categoria,
    precios_por_variante: v(p5, pb),
    activo: true,
    orden: i + 1,
  })
);
