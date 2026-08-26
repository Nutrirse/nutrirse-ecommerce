/**
 * Migracion masiva de productos.json -> tabla `products` de Supabase.
 *
 * Uso (Node 20.6+, sin dependencias nuevas):
 *
 *   npm run seed:dry          -> muestra que haria, no escribe
 *   npm run seed              -> inserta los que faltan
 *   npm run seed -- --sobrescribir
 *
 * Por defecto SALTEA los slugs que ya existen en la base: correr el script
 * dos veces no pisa precios editados a mano desde el panel. Con
 * `--sobrescribir` hace upsert y si los reemplaza.
 *
 * Corre con la service_role key (ignora RLS). Esa clave nunca sale del
 * entorno del servidor: por eso esto es un script local y no un endpoint.
 */

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const DRY_RUN = process.argv.includes('--dry-run');
const SOBRESCRIBIR = process.argv.includes('--sobrescribir');

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_SB || !SERVICE_KEY) {
  console.error(
    '\n[x] Faltan variables de entorno.\n' +
      '    Necesito NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.\n' +
      '    Corre el script con:  node --env-file=.env.local scripts/migrar-productos.mjs\n'
  );
  process.exit(1);
}

const db = createClient(URL_SB, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */

/**
 * Las categorias del JSON son etiquetas humanas; la web filtra por los slugs
 * del mega menu (components/Navbar.tsx) y del alta (components/admin/
 * ProductoModal.tsx). Sin este mapeo los productos entran con una categoria
 * que ningun filtro del sitio matchea y no aparecen en /productos.
 */
const CATEGORIAS = {
  'Frutos Secos': 'frutos-secos',
  'Mixes de Frutos Secos': 'mixes',
  Snacks: 'snacks',
  'Frutas Desecadas': 'secos',
  'Aceites Naturales': 'aceites',
  Condimentos: 'aceites',
  Chocolates: 'chocolates',
  'Chocolates Artesanales': 'chocolates',
  'Confituras y Chocolates': 'chocolates',
  'Insumos de Reposteria': 'reposteria-insumos',
  'Insumos de Repostería': 'reposteria-insumos',
  'Cacao en Polvo': 'reposteria-chocolates',
  'Cacao en Grano': 'reposteria-chocolates',
  Coco: 'reposteria-coco',
  Harinas: 'reposteria-harinas',
  Semillas: 'semillas',
  Suplementos: 'suplementos',
  'Granola y Cereales': 'granola',
  Infusiones: 'infusiones',
};

/** Orden de las secciones en /productos. Define el campo `orden`. */
const ORDEN_CATEGORIAS = [
  'frutos-secos',
  'mixes',
  'snacks',
  'secos',
  'semillas',
  'aceites',
  'chocolates',
  'reposteria-insumos',
  'reposteria-chocolates',
  'reposteria-coco',
  'reposteria-harinas',
  'granola',
  'infusiones',
  'suplementos',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Misma implementacion que `slugify` en lib/supabase-admin.ts. */
function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const redondear = (n) => Math.round(Number(n));

/**
 * Peso por unidad a partir del nombre: "... | 360 cc" -> 0.36 kg.
 * Los envasados no traen peso en el JSON y el cotizador (lib/shipping.ts)
 * factura por kilo: sin esto, un pedido de 15 aceites cotizaria como si
 * pesara cero. cc/ml se toman como gramos (densidad ~1), es una
 * aproximacion consciente.
 */
function pesoUnidadDesdeNombre(nombre) {
  const matches = [...nombre.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|g|cc|ml|l)\b/gi)];
  if (matches.length === 0) return null;

  const ultimo = matches[matches.length - 1];
  const n = Number(String(ultimo[1]).replace(',', '.'));
  if (!Number.isFinite(n)) return null;

  const unidad = ultimo[2].toLowerCase();
  if (unidad === 'kg' || unidad === 'l') return n;
  return n / 1000; // g, cc, ml
}

/* ------------------------------------------------------------------ */
/* Variantes                                                           */
/* ------------------------------------------------------------------ */

const PESO_UNIDAD_FALLBACK = 0.1; // kg, para envasados sin peso en el nombre

/**
 * Arma `precios_por_variante` con el esquema de la tabla:
 * [{ id, label, tipo, precio, peso_kg }]. Descarta las variantes sin precio
 * en vez de guardarlas en 0: un 0 se renderiza como "$0" en la ficha.
 */
function construirVariantes(p) {
  const variantes = [];

  if (p.tipo_venta === 'granel_por_kg') {
    if (p.precio_5kg != null) {
      variantes.push({
        id: '5kg',
        label: '5 kg',
        tipo: 'precio',
        precio: redondear(p.precio_5kg),
        peso_kg: 5,
      });
    }

    const pesoBulto = Number(p.peso_bulto_cerrado_kg);
    if (p.precio_bulto_cerrado != null && Number.isFinite(pesoBulto) && pesoBulto > 0) {
      variantes.push({
        id: 'bolsa',
        label: `Bulto Cerrado (${pesoBulto} kg)`,
        tipo: 'precio',
        precio: redondear(p.precio_bulto_cerrado),
        peso_kg: pesoBulto,
      });
      variantes.push({
        id: 'mayorista',
        label: '+5 bultos (Consultar)',
        tipo: 'consultar',
        precio: null,
        peso_kg: pesoBulto * 5,
      });
    }

    return variantes;
  }

  // por_unidad_pack_cerrado
  const unidades = Number(p.unidades_pack_cerrado);
  const pesoUnidad = pesoUnidadDesdeNombre(p.nombre_producto) ?? PESO_UNIDAD_FALLBACK;

  if (p.precio_pack_cerrado != null && Number.isFinite(unidades) && unidades > 0) {
    const pesoPack = Number((pesoUnidad * unidades).toFixed(3));
    variantes.push({
      id: 'bolsa',
      label: `Caja Cerrada (${unidades} u.)`,
      tipo: 'precio',
      precio: redondear(p.precio_pack_cerrado),
      peso_kg: pesoPack,
    });
    variantes.push({
      id: 'mayorista',
      label: '+5 cajas (Consultar)',
      tipo: 'consultar',
      precio: null,
      peso_kg: Number((pesoPack * 5).toFixed(3)),
    });
  }

  return variantes;
}

/**
 * `nota` trae la condicion por debajo del minimo ("MENOS 6 UNID: $9,000/kg").
 * Va pegada a la descripcion para que el dato no se pierda.
 */
function construirDescripcion(p) {
  const base = (p.descripcion_comercial ?? '').trim();
  const nota = (p.nota ?? '').trim();
  if (!nota) return base || null;
  return `${base}\n\nCondicion especial: ${nota}`.trim();
}

/* ------------------------------------------------------------------ */
/* Migracion                                                           */
/* ------------------------------------------------------------------ */

async function main() {
  const crudo = await readFile(new URL('../productos.json', import.meta.url), 'utf8');
  const origen = JSON.parse(crudo);

  if (!Array.isArray(origen)) {
    throw new Error('productos.json debe ser un array de productos.');
  }

  console.log(`\nproductos.json: ${origen.length} productos leidos.`);

  /* ---- slugs ya tomados en la base ---- */
  const { data: existentes, error: errorLectura } = await db
    .from('products')
    .select('id, slug');
  if (errorLectura) throw new Error(`No pude leer la tabla: ${errorLectura.message}`);

  const yaEnBase = new Set((existentes ?? []).map((r) => r.slug));
  console.log(`Base: ${yaEnBase.size} productos ya cargados.`);

  /* ---- normalizacion ---- */
  const usados = new Set();
  const filas = [];
  const avisos = [];
  const saltados = [];

  // Ordena por categoria (segun ORDEN_CATEGORIAS) y despues por nombre.
  const ordenados = [...origen].sort((a, b) => {
    const ia = ORDEN_CATEGORIAS.indexOf(CATEGORIAS[a.categoria] ?? '');
    const ib = ORDEN_CATEGORIAS.indexOf(CATEGORIAS[b.categoria] ?? '');
    const ca = ia === -1 ? 999 : ia;
    const cb = ib === -1 ? 999 : ib;
    if (ca !== cb) return ca - cb;
    return String(a.nombre_producto).localeCompare(String(b.nombre_producto), 'es');
  });

  ordenados.forEach((p, i) => {
    const nombre = String(p.nombre_producto ?? '').trim();
    if (!nombre) {
      avisos.push(`#${i}: sin nombre_producto, descartado.`);
      return;
    }

    const categoria = CATEGORIAS[p.categoria];
    if (!categoria) {
      avisos.push(`"${nombre}": categoria "${p.categoria}" sin mapeo, queda sin categoria.`);
    }

    const variantes = construirVariantes(p);
    if (variantes.length === 0) {
      avisos.push(`"${nombre}": ninguna variante con precio, descartado.`);
      return;
    }

    // `slug` tiene unique en la tabla: hay que desambiguar dentro del lote.
    let slug = slugify(nombre) || 'producto';
    if (usados.has(slug)) {
      let n = 2;
      while (usados.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    usados.add(slug);

    if (yaEnBase.has(slug) && !SOBRESCRIBIR) {
      saltados.push(slug);
      return;
    }

    filas.push({
      slug,
      nombre,
      descripcion: construirDescripcion(p),
      imagen_url: null, // se cargan despues desde el panel
      categoria: categoria ?? null,
      precios_por_variante: variantes,
      activo: true,
      orden: (i + 1) * 10, // deja hueco para reordenar a mano
    });
  });

  /* ---- reporte ---- */
  console.log(`\nListos para escribir: ${filas.length}`);
  if (saltados.length > 0) {
    console.log(`Salteados (ya existen, usa --sobrescribir): ${saltados.length}`);
  }
  if (avisos.length > 0) {
    console.log(`\nAvisos (${avisos.length}):`);
    avisos.forEach((a) => console.log(`   - ${a}`));
  }

  if (filas.length === 0) {
    console.log('\nNada que hacer.\n');
    return;
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: no se escribio nada. Muestra de la primera fila:\n');
    console.log(JSON.stringify(filas[0], null, 2));
    console.log('');
    return;
  }

  /* ---- escritura por lotes ---- */
  const LOTE = 25;
  let escritos = 0;

  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    const { error } = SOBRESCRIBIR
      ? await db.from('products').upsert(lote, { onConflict: 'slug' })
      : await db.from('products').insert(lote);

    if (error) {
      console.error(`\n[x] Fallo el lote ${i / LOTE + 1}: ${error.message}`);
      console.error(`    Se escribieron ${escritos} productos antes del error.`);
      process.exit(1);
    }

    escritos += lote.length;
    console.log(`   ... ${escritos}/${filas.length}`);
  }

  console.log(`\nListo: ${escritos} productos en Supabase.`);
  console.log('Abri /admin para revisar precios y cargar las imagenes.\n');
}

main().catch((e) => {
  console.error(`\n[x] ${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
