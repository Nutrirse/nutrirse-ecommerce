'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product, ShippingOption, Variant } from '@/types';
import { maxCantidad as topeDeVariante } from '@/lib/variant-limits';

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  shipping: ShippingOption | null;
  cp: string;

  open: () => void;
  close: () => void;
  toggle: () => void;

  addItem: (product: Product, variant: Variant, cantidad?: number) => void;
  removeItem: (key: string) => void;
  setCantidad: (key: string, cantidad: number) => void;
  clear: () => void;

  setShipping: (opt: ShippingOption | null) => void;
  setCp: (cp: string) => void;
};

const keyOf = (productId: string, variantId: string) => `${productId}:${variantId}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      shipping: null,
      cp: '',

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (product, variant, cantidad = 1) =>
        set((s) => {
          const key = keyOf(product.id, variant.id);
          const existing = s.items.find((i) => i.key === key);
          // El tope se aplica aca y no solo en la UI: sumar de a uno desde el
          // modal varias veces llegaria igual a la linea acumulada.
          const tope = topeDeVariante(product, variant);

          const items = existing
            ? s.items.map((i) =>
                i.key === key
                  ? { ...i, cantidad: Math.min(i.cantidad + cantidad, tope), maxCantidad: tope }
                  : i
              )
            : [
                ...s.items,
                {
                  key,
                  productId: product.id,
                  slug: product.slug,
                  nombre: product.nombre,
                  imagen_url: product.imagen_url,
                  variantId: variant.id,
                  variantLabel: variant.label,
                  tipo: variant.tipo,
                  precio: variant.precio,
                  peso_kg: variant.peso_kg,
                  cantidad: Math.min(cantidad, tope),
                  maxCantidad: tope,
                } satisfies CartItem,
              ];

          return { items, isOpen: true };
        }),

      removeItem: (key) =>
        set((s) => ({ items: s.items.filter((i) => i.key !== key) })),

      setCantidad: (key, cantidad) =>
        set((s) => ({
          items:
            cantidad <= 0
              ? s.items.filter((i) => i.key !== key)
              : s.items.map((i) =>
                  // `?? Infinity`: los carritos guardados antes de que
                  // existiera el tope no traen `maxCantidad`.
                  i.key === key
                    ? { ...i, cantidad: Math.min(cantidad, i.maxCantidad ?? Infinity) }
                    : i
                ),
        })),

      clear: () => set({ items: [], shipping: null }),

      setShipping: (shipping) => set({ shipping }),
      setCp: (cp) => set({ cp }),
    }),
    {
      name: 'nutrirse-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, cp: s.cp, shipping: s.shipping }),
    }
  )
);

// ---- Selectores derivados (evitan recalcular en cada render del store) ----

export const selectSubtotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + (i.precio ?? 0) * i.cantidad, 0);

export const selectCount = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.cantidad, 0);

export const selectPesoTotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.peso_kg * i.cantidad, 0);

export const selectTieneConsultar = (s: CartState) =>
  s.items.some((i) => i.tipo === 'consultar');
