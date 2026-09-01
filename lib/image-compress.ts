/**
 * Compresion de imagenes en el navegador, con <canvas> nativo (sin librerias).
 *
 * Por que existe: las Serverless Functions de Vercel cortan cualquier request
 * de mas de 4.5 MB y responden un HTML plano ("Request Entity Too Large"). Una
 * foto de celular de 15 MB no llega nunca al Route Handler. Redimensionando y
 * reencodeando antes de tocar la red, esa misma foto viaja como ~200 KB.
 *
 * Solo puede correr en el cliente: usa document, createImageBitmap y canvas.
 */

/** Lado maximo. Las cards del catalogo nunca piden mas de 640px. */
export const LADO_MAX = 1200;
/** Calidad del reencode. 0.8 es el punto donde el peso cae sin artefactos visibles. */
export const CALIDAD = 0.8;
/** Piso de peso: por debajo de esto reencodear no gana nada y puede empeorar. */
const MIN_BYTES_PARA_COMPRIMIR = 200 * 1024;

const SIN_REENCODE = ['image/avif'];

type Opciones = {
  ladoMax?: number;
  calidad?: number;
};

/**
 * Devuelve un File listo para subir: mismo contenido, redimensionado a
 * `ladoMax` (respetando aspect ratio) y reencodeado a WEBP.
 *
 * Nunca tira: si el navegador no puede decodificar o encodear, devuelve el
 * File original y deja que el server valide el peso.
 */
export async function comprimirImagen(file: File, opts: Opciones = {}): Promise<File> {
  const ladoMax = opts.ladoMax ?? LADO_MAX;
  const calidad = opts.calidad ?? CALIDAD;

  // AVIF ya viene chico y el canvas no lo reencodea mejor. GIF perderia la animacion.
  if (SIN_REENCODE.includes(file.type) || !file.type.startsWith('image/')) return file;

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await decodificar(file);
  } catch {
    return file;
  }

  const { width, height } = bitmap;
  if (!width || !height) return file;

  const escala = Math.min(1, ladoMax / Math.max(width, height));
  const yaChica = escala === 1 && file.size < MIN_BYTES_PARA_COMPRIMIR;
  if (yaChica) {
    cerrar(bitmap);
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * escala);
  canvas.height = Math.round(height * escala);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cerrar(bitmap);
    return file;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  cerrar(bitmap);

  // WEBP conserva el canal alpha (varios productos son PNG recortado) y pesa
  // menos que JPEG a igual calidad. Si el navegador no lo soporta, toBlob
  // devuelve PNG: en ese caso caemos a JPEG salvo que la fuente tenga alpha.
  let blob = await aBlob(canvas, 'image/webp', calidad);
  if (blob && blob.type !== 'image/webp' && file.type !== 'image/png') {
    blob = (await aBlob(canvas, 'image/jpeg', calidad)) ?? blob;
  }
  if (!blob) return file;

  // Si el "comprimido" quedo mas grande (pasa con PNG chicos ya optimizados),
  // el original gana.
  if (escala === 1 && blob.size >= file.size) return file;

  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
  return new File([blob], `${baseNombre(file.name)}.${ext}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/* ------------------------------------------------------------------ */
/* Internos                                                           */
/* ------------------------------------------------------------------ */

async function decodificar(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    // `imageOrientation` aplica el EXIF: sin esto las fotos verticales de
    // iPhone se suben rotadas.
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* Safari viejo no acepta las opciones: seguimos con <img>. */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cerrar(bitmap: ImageBitmap | HTMLImageElement) {
  if ('close' in bitmap) bitmap.close();
}

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
}

function baseNombre(nombre: string): string {
  const base = nombre.replace(/\.[^.]+$/, '') || 'imagen';
  return base.slice(0, 60);
}

/** "1.4 MB". Para mostrarle al admin cuanto se ahorro. */
export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
