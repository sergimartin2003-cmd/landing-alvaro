# GTshop · E-commerce de streetwear (marca propia)

E-commerce completo de ropa urbana de **marca propia GTshop**, con tienda pública,
carrito, pago con Stripe y dos paneles de administración (pedidos en tiempo real y
gestión de catálogo).

- **Landing pública**: catálogo por categorías, ficha de producto, carrito y checkout.
- **Terminal de Ventas** (`/admin/pedidos`): pedidos en tiempo real, detalle, cambio de
  estado, filtros, buscador y exportación a CSV.
- **Terminal de Productos** (`/admin/productos`): alta/edición/borrado de productos con
  tallas, stock por talla e imágenes. Los cambios se reflejan en la tienda al instante.

## Stack

- **Next.js 16** (App Router · Server Components · Server Actions) — _nota: `create-next-app`
  instala hoy la 16, totalmente compatible con lo que pedía el proyecto (App Router + Server
  Actions). En Next 16 el antiguo `middleware.ts` se llama `proxy.ts`._
- **Supabase** (Postgres + Auth + Storage + Realtime) vía `@supabase/ssr`.
- **Stripe Checkout** (hosted) + Webhooks.
- **Tailwind CSS v4** + componentes estilo **shadcn/ui**.
- **Zustand** (carrito persistido en `localStorage`).
- **Sonner** (toasts) · **lucide-react** (iconos).

## Requisitos previos

- Node.js 20+ (probado con Node 22).
- Una cuenta de [Supabase](https://supabase.com) (plan gratuito vale).
- Una cuenta de [Stripe](https://stripe.com) (modo test).
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) y
  [Stripe CLI](https://docs.stripe.com/stripe-cli) para desarrollo local.

## 1. Instalación

```bash
npm install
cp .env.local.example .env.local   # rellena tus claves
```

## 2. Variables de entorno (`.env.local`)

| Variable | Dónde se obtiene |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**secreta**, solo servidor) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` (local) o el endpoint del panel de Stripe (prod) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (ej. `http://localhost:3000`) |

> ⚠️ No se incluyen claves reales en el repo. `.env.local` está en `.gitignore`.

## 3. Base de datos (Supabase)

Las migraciones y el seed están en `supabase/`.

### Opción A — Supabase CLI (recomendada)

```bash
supabase login
supabase link --project-ref <TU_PROJECT_REF>
supabase db push            # aplica supabase/migrations/*.sql
# Carga los datos de ejemplo (7 categorías + 4 productos):
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
# (o, en un proyecto local: `supabase db reset`, que aplica migraciones + seed)
```

### Opción B — SQL Editor del panel

Ejecuta, en orden, el contenido de:

1. `supabase/migrations/20260101000001_schema.sql` — tablas, enum, secuencia y triggers.
2. `supabase/migrations/20260101000002_rls.sql` — RLS y permisos.
3. `supabase/migrations/20260101000003_functions.sql` — RPC `confirm_order_paid` + Realtime.
4. `supabase/migrations/20260101000004_storage.sql` — bucket `product-images`.
5. `supabase/seed.sql` — datos de ejemplo (opcional).

### Qué crean las migraciones

- Tablas: `categories`, `products`, `product_variants`, `orders`, `order_items`, `admin_users`.
- Enum `order_status`: `pendiente → pagado → preparando → enviado → entregado / cancelado`.
- Nº de pedido autogenerado tipo `GT-00001` (secuencia + trigger).
- **RLS**: el público solo lee categorías y productos/variantes **activos**; `orders` y toda
  escritura quedan restringidas a administradores; el webhook usa la _service role_ (salta RLS).
- **RPC `confirm_order_paid`**: marca el pedido como pagado y descuenta stock de forma
  atómica e idempotente.
- **Storage**: bucket público `product-images` (lectura pública, escritura solo admin).
- **Realtime**: se publica la tabla `orders` para la Terminal de Ventas.

## 4. Crear tu usuario administrador

1. Supabase → **Authentication → Users → Add user** (email + contraseña, marca “Auto Confirm”).
2. Copia su `id` (UUID) y márcalo como admin en el **SQL Editor**:

```sql
insert into public.admin_users (user_id, email)
values ('<UUID_DEL_USUARIO>', 'tu@email.com');
```

Con eso ya puedes entrar en `/admin/login`. Las rutas `/admin/*` están protegidas por
`src/proxy.ts` + un guard en el layout del panel.

## 5. Stripe

### Local (Stripe CLI)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copia el `whsec_...` que imprime en STRIPE_WEBHOOK_SECRET
```

Tarjeta de prueba: `4242 4242 4242 4242`, fecha futura, cualquier CVC/CP.

### Producción

1. Stripe → **Developers → Webhooks → Add endpoint**:
   `https://TU_DOMINIO/api/webhooks/stripe`.
2. Evento a escuchar: `checkout.session.completed`.
3. Copia el signing secret del endpoint a `STRIPE_WEBHOOK_SECRET` en Vercel.

## 6. Ejecutar en local

```bash
npm run dev      # http://localhost:3000
```

- Tienda: `/`
- Panel: `/admin/login`

## 7. Despliegue en Vercel

1. Importa el repo en Vercel.
2. Añade todas las variables de entorno (sección 2). Pon `NEXT_PUBLIC_SITE_URL` con tu
   dominio de producción.
3. Configura el webhook de Stripe apuntando a tu dominio (sección 5).
4. En Supabase → **Authentication → URL Configuration**, añade tu dominio a
   _Site URL_ y _Redirect URLs_.

## Estructura del proyecto

```
supabase/
  migrations/         Migraciones SQL (esquema, RLS, funciones, storage)
  seed.sql            Datos de ejemplo
  config.toml         Config del proyecto Supabase
src/
  app/
    (shop)/           Tienda pública (home, tienda, producto, carrito, checkout)
    admin/
      login/          Login de admin
      (panel)/        Panel protegido (pedidos, productos)
    api/webhooks/stripe/  Webhook de Stripe
  components/
    ui/               Componentes base (shadcn/ui)
    layout/ product/ cart/ checkout/ admin/
  lib/
    supabase/         Clientes browser/server/service-role + proxy helper
    stripe/           Instancia de Stripe (servidor)
    actions/          Server Actions (checkout, products, orders, auth)
    queries/          Lecturas de catálogo y de admin
    store/            Carrito (Zustand)
    types/ utils.ts constants.ts
  proxy.ts            Protección de rutas /admin/* (antes middleware.ts)
```

## Flujo de compra (resumen)

1. El usuario añade productos al carrito (Zustand, persistido).
2. En `/checkout` rellena sus datos; se crea un pedido `pendiente` **recalculando precios y
   stock desde la BD** y se abre una Stripe Checkout Session.
3. Tras pagar, Stripe redirige a `/checkout/success` (se vacía el carrito).
4. El webhook `checkout.session.completed` llama a `confirm_order_paid`: el pedido pasa a
   `pagado` y se descuenta el stock.
5. El pedido aparece **solo** (Supabase Realtime) en `/admin/pedidos`.

## Checklist de “terminado” (v1)

- [x] Alta de producto con tallas/stock desde el panel → aparece en su categoría en la tienda.
- [x] Navegar categoría → añadir al carrito → pagar con Stripe (test) → confirmación.
- [x] El pedido aparece automáticamente en la Terminal de Ventas con todos los datos de envío.
- [x] El stock se descuenta tras el pago.
- [x] Las rutas `/admin/*` están bloqueadas para quien no sea admin.

## Notas

- Todo el copy de productos y el hero son placeholders editables (no hardcodeados en la lógica).
- Borrado de productos: si el producto tiene pedidos asociados se hace _soft delete_
  (`active = false`) para preservar el histórico; si no, se borra de verdad.
- Las páginas de tienda usan `force-dynamic`, así que los cambios del catálogo se ven al
  instante sin revalidación manual.
