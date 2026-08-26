import { WHATSAPP_NUMBER } from './whatsapp';

/**
 * Datos del negocio en un solo lugar. Los consumen los metadatos, el
 * JSON-LD, el sitemap y el robots. Antes de publicar hay que revisar
 * SITE_URL y la direccion: son los dos que dan senales a Google.
 */

/**
 * URL canonica de produccion, sin barra final.
 * En Vercel, definir NEXT_PUBLIC_SITE_URL con el dominio propio apenas
 * este listo: el fallback .vercel.app funciona, pero cambiar de dominio
 * despues obliga a que Google reindexe todo de cero.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nutrirse.vercel.app'
).replace(/\/+$/, '');

export const SITE_NAME = 'Nutrirse';

export const SITE_TITLE = 'Nutrirse | Frutos secos por mayor en Salta';

export const SITE_DESCRIPTION =
  'Distribuidora mayorista de frutos secos, frutas desecadas y semillas en Salta Capital. ' +
  'Precios por 5 kg, bulto cerrado y volumen, con envíos a todo el país. Mínimo de compra 5 kg.';

/** Se usan en `keywords`. Google las ignora hace años; Bing y varios motores de respuesta no. */
export const SITE_KEYWORDS = [
  'frutos secos por mayor',
  'distribuidora de frutos secos Salta',
  'mayorista frutos secos Argentina',
  'frutas desecadas por mayor',
  'semillas por mayor',
  'venta mayorista de almendras',
  'nueces por mayor',
  'castañas de cajú mayorista',
  'proveedor de frutos secos',
  'envíos a todo el país',
];

/** Imagen de OpenGraph/Twitter. 1200x630 es lo que esperan las previews. */
export const OG_IMAGE = {
  url: '/Logo.png',
  width: 1200,
  height: 630,
  alt: 'Nutrirse · Frutos secos por mayor desde Salta',
};

export const NEGOCIO = {
  email: 'ventas@nutrirse.com.ar',
  telefono: `+${WHATSAPP_NUMBER}`,
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
  ciudad: 'Salta',
  provincia: 'Salta',
  pais: 'AR',
  codigoPostal: '4400',
  /**
   * Sin calle todavia. Schema acepta una direccion parcial, pero para que
   * el negocio aparezca en resultados locales hace falta la calle real y
   * que coincida con la ficha de Google Business Profile.
   */
  calle: null as string | null,
  /** Solo URLs reales: un `sameAs` a "#" o a un perfil vacio resta confianza. */
  redes: [] as string[],
};
