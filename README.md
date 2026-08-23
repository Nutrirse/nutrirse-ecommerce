# Nutrirse — E-commerce B2B mayorista

Next.js 15 (App Router) · Tailwind v4 · GSAP ScrollTrigger · Zustand · Supabase · Vercel.
Sin pasarela de pago: el checkout arma un ticket y lo abre en WhatsApp.

## Arranque

```bash
npm install
cp .env.local.example .env.local   # completar credenciales
npm run dev
```

Sin `.env.local` la app corre igual usando `lib/fallback-products.ts` (espejo del seed).

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (solo lectura vía RLS) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número destino sin `+` ni espacios, ej. `5493875551234` |

## Supabase

Ejecutar `supabase/schema.sql` en el SQL Editor. Crea `products`, índices,
trigger de `updated_at`, política RLS de lectura pública y seed de 6 productos.

Las variantes viven en `precios_por_variante` (jsonb):

```json
[
  { "id": "5kg",       "label": "5 kg",                        "tipo": "precio",    "precio": 52000, "peso_kg": 5 },
  { "id": "bolsa",     "label": "Bolsa cerrada",               "tipo": "precio",    "precio": 238000, "peso_kg": 25 },
  { "id": "mayorista", "label": "Más de 5 bolsas (Consultar)", "tipo": "consultar", "precio": null,  "peso_kg": 125 }
]
```

`tipo: "consultar"` = sin precio; el ítem viaja al ticket como *a cotizar*.

## Estructura

```
app/
  page.tsx              Home (ISR 1 h, force-static)
  checkout/page.tsx     Checkout
  api/shipping/route.ts Cotizador (edge)
components/             Hero (GSAP), ProductGrid/Card, CartDrawer, ShippingCalculator, CheckoutForm
lib/                    supabase, products (ISR), shipping, whatsapp, format
store/cart.ts           Zustand + persist (localStorage)
supabase/schema.sql     Esquema + seed
```

## Envíos

`lib/shipping.ts` simula Zippin/Envíopack: zonifica por CP desde Salta (4400),
tarifa `BASE + POR_KG × (peso-1)` por factor de zona, y devuelve 6 opciones
(Andreani / OCA / Correo Argentino × Domicilio / Sucursal).

Para conectar el proveedor real: reemplazar el cuerpo de `cotizar()` por el
fetch a la API manteniendo la firma y el tipo `ShippingOption[]`. La ruta
`/api/shipping` acepta `POST {cp, peso_kg}` y `GET ?cp=&peso_kg=`.

## ISR

`revalidate = 3600` en `app/page.tsx`. Para invalidar al instante al editar
precios, agregar un webhook de Supabase a un Route Handler que llame
`revalidatePath('/')`.

## Deploy

Push a GitHub → importar en Vercel → cargar las 3 env vars. Sin config extra.
