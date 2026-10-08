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
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nutrirsehoy.com'
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

/**
 * Imagen de OpenGraph/Twitter. Va como URL relativa: `metadataBase` la
 * convierte en absoluta, que es lo unico que leen WhatsApp, Facebook y X.
 *
 * OJO: el archivo actual mide 1200x360. Para `summary_large_image` hace
 * falta 1200x630 (relacion 1.91:1); con 3.33:1 X descarta la card grande y
 * WhatsApp recorta. Hay que reexportar /public/og-image.jpg a 1200x630 y
 * actualizar `height` si el tamano cambia.
 */
export const OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Nutrirse · Frutos secos por mayor desde Salta',
  type: 'image/jpeg',
};

/**
 * Logo cuadrado/vertical para el JSON-LD. Separado de la OG image porque
 * Google pide el logo real de la marca, no la placa de preview social.
 */
export const LOGO_IMAGE = '/Logo.png';

/**
 * Preguntas frecuentes B2B. Son la fuente unica del schema `FAQPage` y de
 * cualquier bloque visible que las muestre. Los motores de respuesta (AI
 * Overviews, Perplexity, ChatGPT Search) extraen de aca las reglas duras de
 * compra minima, bonificacion de envio y cobertura logistica.
 *
 * Regla de Google: si una respuesta aparece en el schema tambien tiene que
 * ser visible en la pagina. Por eso el FAQPage se inyecta en /contacto, que
 * es donde estan los canales y la info de envios.
 */
export const FAQ = [
  {
    pregunta: '¿Cuál es el mínimo de compra?',
    respuesta:
      'El mínimo es de 5 kg por producto o bulto cerrado. Trabajamos exclusivamente por mayor, ' +
      'así que cada artículo se vende en variantes de 5 kg o en su bulto original cerrado.',
  },
  {
    pregunta: '¿Tienen envíos gratis?',
    respuesta:
      'No. Los costos de envío están a cargo del comprador y se calculan según el destino y el ' +
      'peso del pedido, directamente en el checkout o al confirmar por WhatsApp. La única ' +
      'modalidad sin costo de envío es el retiro por nuestro depósito en Salta Capital.',
  },
  {
    pregunta: '¿Hacen envíos a todo el país?',
    respuesta:
      'Sí. Despachamos desde Salta Capital a toda la Argentina mediante transportes como Andreani, ' +
      'OCA, Correo Argentino, Buspack y Flechabus, entre otros, con entrega a domicilio o a sucursal. ' +
      'También se puede retirar sin cargo por el depósito coordinando turno previo por WhatsApp.',
  },
  {
    pregunta: '¿Puedo usar mi propio transporte si soy de otra provincia?',
    respuesta:
      'Sí, por supuesto. Si ya contás con un comisionista o transporte de confianza, podés elegir ' +
      'la opción de retiro por depósito y coordinar para que pasen a buscar tu pedido por nuestro ' +
      'local en Salta Capital.',
  },
  {
    pregunta: '¿A quiénes están dirigidas las ventas?',
    respuesta:
      'Somos mayoristas B2B. Abastecemos a dietéticas, panaderías, restaurantes, negocios de ' +
      'meriendas y cafeterías, gimnasios, fábricas de alfajores y comercios en general que busquen ' +
      'mercadería de primera calidad con excelentes precios por volumen.',
  },
];

/**
 * Perfiles sociales. `null` = todavia no existe: el Footer oculta el icono
 * y el JSON-LD lo deja fuera de `sameAs`. Nunca poner "#" ni un perfil
 * vacio, resta confianza en los datos estructurados.
 */
export const REDES = {
  instagram: 'https://www.instagram.com/nutrirse.hoy/' as string | null,
  facebook: 'https://www.facebook.com/nutrirsehoy' as string | null,
  tiktok: 'https://www.tiktok.com/@nutrirse.hoy' as string | null,
};

export const NEGOCIO = {
  email: 'nutrirsehoy.26@gmail.com',
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
  /** Se arma solo desde REDES: solo entran las URLs reales. Lo consume `sameAs`. */
  redes: Object.values(REDES).filter((u): u is string => Boolean(u)),
};

/**
 * Datos del responsable de la base de datos (Ley 25.326). Los consumen
 * /politica-de-privacidad y /terminos-y-condiciones. `null` = el cliente
 * todavia no lo paso: la pagina muestra el hueco entre corchetes para que
 * se note antes de publicar. NUNCA inventar un numero de inscripcion.
 */
export const LEGAL = {
  razonSocial: null as string | null,
  cuit: null as string | null,
  /** N.º de inscripcion en el Registro Nacional de Bases de Datos (AAIP). */
  registroBaseDatos: null as string | null,
  /** Fecha de la ultima revision de los textos legales. */
  actualizado: '2026-10-05',
};
