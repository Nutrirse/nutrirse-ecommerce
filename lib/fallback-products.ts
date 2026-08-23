import type { Product, Variant } from '@/types';

// Espejo del seed de supabase/schema.sql.
// Permite correr `npm run dev` sin credenciales de Supabase.
const v = (precio5: number, precioBolsa: number): Variant[] => [
  { id: '5kg', label: '5 kg', tipo: 'precio', precio: precio5, peso_kg: 5 },
  { id: 'bolsa', label: 'Bolsa cerrada', tipo: 'precio', precio: precioBolsa, peso_kg: 25 },
  { id: 'mayorista', label: 'Más de 5 bolsas (Consultar)', tipo: 'consultar', precio: null, peso_kg: 125 },
];

export const FALLBACK_PRODUCTS: Product[] = [
  ['nuez-mariposa', 'Nuez Mariposa', 'Nuez pelada mitad mariposa, calibre extra. Cosecha reciente.', 'frutos-secos', 52000, 238000],
  ['almendra-nonpareil', 'Almendra Nonpareil', 'Almendra californiana sin cáscara, calibre 23/25.', 'frutos-secos', 61000, 285000],
  ['castana-caju', 'Castaña de Cajú W320', 'Cajú entero W320 tostado natural, origen Brasil.', 'frutos-secos', 78000, 365000],
  ['mani-tostado', 'Maní Tostado Pelado', 'Maní tipo runner tostado sin sal, alta rotación.', 'frutos-secos', 14500, 66000],
  ['pasa-uva-sultanina', 'Pasa de Uva Sultanina', 'Pasa sultanina sin semilla, húmeda, San Juan.', 'secos', 19800, 91000],
  ['ciruela-desc', 'Ciruela Desecada s/carozo', "Ciruela D'Agen sin carozo, calibre 60/70.", 'secos', 24500, 112000],
].map(([slug, nombre, descripcion, categoria, p5, pb], i) => ({
  id: `local-${slug}`,
  slug: slug as string,
  nombre: nombre as string,
  descripcion: descripcion as string,
  imagen_url: null,
  categoria: categoria as string,
  precios_por_variante: v(p5 as number, pb as number),
  activo: true,
  orden: i + 1,
}));
