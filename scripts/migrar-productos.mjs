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

/**
 * Como leer el campo `precio` de cada variante del JSON.
 *
 *   'total'    -> el numero es el precio final de esa presentacion.
 *                 "Bolsa 5 kg: 21750" se publica como $21.750.
 *   'unitario' -> el numero es el precio por kg (granel) o por unidad
 *                 (packs), y hay que multiplicarlo por `cantidad`.
 *                 "Bolsa 5 kg: 21750" se publica como $108.750.
 *
 * Ver el bloque de avisos al final del script: si los precios bajan cuando
 * sube la cantidad, el JSON esta en 'unitario' y este flag esta mal puesto.
 */
const LECTURA_PRECIO = 'unitario';

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
 * Los envasados no declaran peso y el cotizador (lib/shipping.ts) factura
 * por kilo: sin esto, un pack de 15 aceites cotizaria como si pesara cero.
 * cc/ml se toman como gramos (densidad ~1): es una aproximacion consciente.
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
 * Peso real de la presentacion, en kg. Es lo que consume el cotizador de
 * envios, no tiene nada que ver con el precio.
 */
function pesoDeVariante(v, nombreProducto) {
  const cantidad = Number(v.cantidad);

  if (v.unidad_cantidad === 'kg' && Number.isFinite(cantidad)) {
    return cantidad;
  }

  if (v.unidad_cantidad === 'unidad' && Number.isFinite(cantidad)) {
    const pesoUnidad = pesoUnidadDesdeNombre(nombreProducto) ?? PESO_UNIDAD_FALLBACK;
    return Number((pesoUnidad * cantidad).toFixed(3));
  }

  // `cantidad: null` -> filas tipo "Menos de 6 unidades (pedido chico)".
  // No declaran cantidad, asi que no hay peso que calcular.
  return null;
}

/**
 * Precio publicado de la presentacion.
 *
 * Con LECTURA_PRECIO = 'unitario' el numero del JSON es el valor por kg
 * (granel) o por unidad (packs) y se multiplica por `cantidad`.
 */
function precioDeVariante(v) {
  const precio = Number(v.precio);
  if (!Number.isFinite(precio) || precio <= 0) return null;

  if (LECTURA_PRECIO === 'total') return redondear(precio);

  const cantidad = Number(v.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 0) return redondear(precio);
  return redondear(precio * cantidad);
}

/**
 * Arma `precios_por_variante` con el esquema de la tabla:
 * [{ id, label, tipo, precio, peso_kg }].
 *
 * El catalogo expone SOLO tres escalones, que es lo acordado con el cliente:
 *
 *   5kg       -> presentacion base (la fila de 5 kg del Excel)
 *   bolsa     -> bulto cerrado (la presentacion mas grande del Excel)
 *   mayorista -> "+5 bultos (Consultar)"
 *
 * Las presentaciones intermedias del Excel (bolsas de 2 kg, packs de 3 o 7
 * unidades) se descartan a proposito: se cargan igual en la fuente pero no
 * se publican.
 */
function construirVariantes(p) {
  const nombre = String(p.nombre_producto ?? '');
  const porUnidad = p.tipo_venta === 'unidad';

  // Solo las filas vendibles: con precio y con peso calculable.
  const disponibles = (Array.isArray(p.variantes) ? p.variantes : [])
    .map((v) => {
      const precio = precioDeVariante(v);
      const peso = pesoDeVariante(v, nombre);
      if (precio === null || peso === null || !(peso > 0)) return null;
      return { precio, peso, cantidad: Number(v.cantidad), label: String(v.presentacion ?? '').trim() };
    })
    .filter(Boolean)
    .sort((a, b) => a.peso - b.peso);

  if (disponibles.length === 0) return [];

  /* ---- Base: la fila de 5 kg. Si el producto no la tiene (solo viene en
     2 kg, en conservadora de 6 kg o en packs), cae a la presentacion mas
     chica: descartarla dejaria el producto sin nada que vender. ---- */
  const cinco = disponibles.find((v) => !porUnidad && v.peso === 5);
  const base = cinco ?? disponibles[0];
  const bulto = disponibles[disponibles.length - 1];

  const variantes = [
    {
      id: '5kg',
      label: base === cinco ? '5 kg' : base.label,
      tipo: 'precio',
      precio: base.precio,
      peso_kg: base.peso,
    },
  ];

  // Si la mas grande es la misma que la base, el producto tiene una sola
  // presentacion: no se inventa un bulto duplicado.
  if (bulto !== base) {
    variantes.push({
      id: 'bolsa',
      label: porUnidad
        ? `Bulto Cerrado (${bulto.cantidad} u.)`
        : `Bulto Cerrado (${bulto.peso} kg)`,
      tipo: 'precio',
      precio: bulto.precio,
      peso_kg: bulto.peso,
    });
  }

  const mayor = variantes[variantes.length - 1];
  variantes.push({
    id: 'mayorista',
    label: '+5 bultos (Consultar)',
    tipo: 'consultar',
    precio: null,
    peso_kg: Number((mayor.peso_kg * 5).toFixed(3)),
  });

  return variantes;
}

/**
 * Las filas con `cantidad: null` ("Menos de 6 unidades") son una condicion
 * comercial, no una presentacion vendible: se descartan como variante y se
 * anotan en la descripcion para que el dato no se pierda.
 */
function construirDescripcion(p) {
  const base = String(p.descripcion_comercial ?? '').trim();
  const sueltas = (Array.isArray(p.variantes) ? p.variantes : [])
    .filter((v) => v.cantidad == null && v.precio != null)
    .map((v) => `${String(v.presentacion ?? '').trim()}: $${Number(v.precio).toLocaleString('es-AR')}`);

  if (sueltas.length === 0) return base || null;
  return `${base}\n\nCondiciones especiales: ${sueltas.join(' · ')}`.trim();
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
  console.log(`Lectura de precios: ${LECTURA_PRECIO.toUpperCase()}`);

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
  const invertidos = [];
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
      avisos.push(`"${nombre}": ninguna variante con precio y peso, descartado.`);
      return;
    }

    // Control de coherencia: mas kilos por menos plata no existe. Si pasa,
    // el JSON trae precios unitarios y LECTURA_PRECIO deberia ser 'unitario'.
    const conPrecio = variantes.filter((v) => v.tipo === 'precio');
    for (let k = 1; k < conPrecio.length; k++) {
      if (conPrecio[k].precio < conPrecio[k - 1].precio) {
        invertidos.push(
          `${nombre}: ${conPrecio[k - 1].label} $${conPrecio[k - 1].precio} > ` +
            `${conPrecio[k].label} $${conPrecio[k].precio}`
        );
        break;
      }
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

  if (invertidos.length > 0) {
    console.log(
      `\n[!] ${invertidos.length} productos quedan con la presentacion grande MAS BARATA que la chica:`
    );
    invertidos.slice(0, 8).forEach((a) => console.log(`   - ${a}`));
    if (invertidos.length > 8) console.log(`   ... y ${invertidos.length - 8} mas.`);
    console.log(
      '    Eso pasa cuando el JSON trae precio por kg/unidad y se publica como total.\n' +
        "    Si es el caso, poner LECTURA_PRECIO = 'unitario' arriba del script."
    );
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
