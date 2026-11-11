# Roma Propiedades Paraná

Catálogo inmobiliario y panel de administración para **ROMA Inmobiliaria (Paraná, Entre Ríos)**, desarrollado con React, TypeScript, Tailwind CSS y Supabase.

## Características

- **Catálogo público**: Filtro en tiempo real por operación (venta/alquiler), tipo de propiedad (casa, departamento, terreno, local, campo, galpón), localidad, dormitorios, baños, rango de precios y cochera.
- **Detalle de propiedad**: Galería de fotos optimizadas en formato WebP, ficha técnica, comodidades, mapa interactivo y contacto directo por WhatsApp.
- **Panel de administración (`/admin`)**:
  - Autenticación mediante **Supabase Auth**.
  - Gestión completa de propiedades (alta, edición, baja, ordenamiento drag-and-drop de fotos y compresión automática a WebP en el navegador).
  - Gestión de clientes/propietarios asociados a cada inmueble.
  - Panel de estadísticas con métricas de visitas, clics a WhatsApp y veces compartido.

## Requisitos previos

Crear un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

## Scripts disponibles

- `npm install` — Instala las dependencias del proyecto.
- `npm run dev` — Inicia el servidor de desarrollo local con Vite.
- `npm run build` — Compila la aplicación para producción en la carpeta `dist/`.
- `npm run lint` — Ejecuta el análisis estático con ESLint.
- `npm run typecheck` — Verifica los tipos de TypeScript sin emitir archivos.
