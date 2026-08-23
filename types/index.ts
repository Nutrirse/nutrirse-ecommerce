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
};

export type ShippingOption = {
  id: string;
  carrier: 'Andreani' | 'OCA' | 'Correo Argentino';
  service: 'Domicilio' | 'Sucursal';
  label: string;
  price: number;
  eta_dias: [number, number];
};

export type Customer = {
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  cp: string;
  localidad: string;
  direccion: string;
};
