export type VariantId = '5kg' | 'bolsa' | 'mayorista' | (string & {});

export type Variant = {
  id: VariantId;
  label: string;
  tipo: 'precio' | 'consultar';
  precio: number | null;
  peso_kg: number;
};

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  categoria: string | null;
  precios_por_variante: Variant[];
  activo: boolean;
  orden: number;
};

export type CartItem = {
  key: string;            // `${productId}:${variantId}`
  productId: string;
  slug: string;
  nombre: string;
  imagen_url: string | null;
  variantId: VariantId;
  variantLabel: string;
  tipo: 'precio' | 'consultar';
  precio: number | null;  // null => a cotizar
  peso_kg: number;
  cantidad: number;
  /**
   * Tope de la linea, calculado con `maxCantidad()` al agregar. Se guarda en
   * el item porque el CartDrawer no tiene el `Product` completo a mano.
   * Opcional: los carritos ya persistidos en localStorage no lo traen.
   */
  maxCantidad?: number;
};

export type ShippingOption = {
  id: string;
  carrier: 'Andreani' | 'OCA' | 'Correo Argentino';
  service: 'Domicilio' | 'Sucursal';
  label: string;
  price: number;
  eta_dias: [number, number];
};

export type MetodoPago = 'transferencia' | 'efectivo';

export type Customer = {
  nombre: string;
  apellido: string;
  dni: string;          // DNI o CUIT, sin puntos ni guiones
  telefono: string;
  email: string;        // opcional en el formulario
  // Envio
  cp: string;
  provincia: string;
  ciudad: string;
  direccion: string;
  altura: string;
  piso: string;         // opcional
  indicaciones: string; // opcional
  metodoPago: MetodoPago;
};
