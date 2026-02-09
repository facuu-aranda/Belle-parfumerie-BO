# Belle Parfumerie — Backoffice

Panel de administración para Belle Parfumerie. Gestión de productos, stock y ventas con persistencia en Firebase Realtime Database e imágenes en Cloudinary.

## Stack

- **Next.js 16** (App Router, puerto 3001)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Firebase Realtime Database**
- **Cloudinary** (upload de imágenes)
- **Zustand** (estado del carrito de ventas)
- **Framer Motion** (animaciones)
- **Lucide React** (iconos)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env.local con las variables de Firebase y Cloudinary
# (ver template abajo)

# 3. Ejecutar en desarrollo
npm run dev
```

### Variables de entorno (`.env.local`)

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
```

## Migración de datos

Para migrar los datos de ejemplo a Firebase:

```bash
npx tsx scripts/migrate.ts
```

## Credenciales de acceso

| Usuario    | Contraseña  | Rol       |
|------------|-------------|-----------|
| admin      | admin123    | Admin     |
| vendedor   | venta123    | Vendedor  |

## Estructura del proyecto

```
src/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx          # Login
│   │   └── dashboard/
│   │       ├── layout.tsx          # Auth guard + header
│   │       ├── page.tsx            # Menú principal
│   │       ├── productos/page.tsx  # Gestión de productos
│   │       └── venta/page.tsx      # Generar ventas
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Redirect → login
├── components/admin/
│   ├── BentoMenu.tsx
│   ├── ConfirmDialog.tsx
│   ├── ImageUploader.tsx
│   ├── LoginForm.tsx
│   ├── ProductEditModal.tsx
│   ├── ProductList.tsx
│   ├── SaleForm.tsx
│   ├── SaleProductRow.tsx
│   └── SuccessDialog.tsx
├── hooks/
│   └── useProducts.ts              # Firebase realtime listener
├── lib/
│   ├── auth.ts                     # Login hardcodeado
│   ├── cloudinary.ts               # Upload de imágenes
│   ├── firebase.ts                 # Conexión Firebase
│   └── pricing.ts                  # Cálculo de ofertas
├── store/
│   └── useAdminStore.ts            # Estado de ventas (Zustand)
├── types/
│   └── product.ts                  # Tipos compartidos
scripts/
└── migrate.ts                      # Migración de datos a Firebase
```
