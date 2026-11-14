# Recetario familiar — App

Aplicación móvil **offline-first** en React Native + Expo para conservar las recetas de la abuela:
ingredientes, pasos, foto y búsqueda por ingrediente. Funciona sin conexión (SQLite como fuente de
verdad local) y se sincroniza con una API REST propia (Next.js + Firebase) cuando hay conexión.

## Stack

- **Expo (SDK 58) + React Native + TypeScript estricto + Expo Router**
- **expo-sqlite** — persistencia local (fuente de verdad, funciona sin conexión)
- **expo-secure-store** — tokens de sesión
- **react-native-gesture-handler + react-native-reanimated** — gestos
- **expo-camera, expo-image-picker, expo-image-manipulator, expo-keep-awake, expo-sensors, expo-speech** — capacidades del dispositivo
- **Jest + jest-expo + React Native Testing Library** — pruebas

## Puesta en marcha

```bash
npm install
cp .env.example .env        # pon EXPO_PUBLIC_API_URL=https://<tu-api>.vercel.app
npx expo start
```

Para abrir en un dispositivo: escanea el QR con Expo Go, o ejecuta `npm run android` / `npm run ios`.

## Comandos

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo (Metro) |
| `npm test` | Ejecuta las pruebas (Jest) |
| `npm run typecheck` | Verifica tipos TypeScript (`tsc --noEmit`) |
| `npm run lint` | Linter (ESLint) |
| `npm run android` / `npm run ios` / `npm run web` | Abre en la plataforma indicada |

## Estructura

```text
app/                      # Rutas de Expo Router
├── _layout.tsx           # Stack raíz + GestureHandlerRootView + SessionProvider
├── (tabs)/
│   ├── _layout.tsx       # Tabs (Recetas / Favoritas)
│   ├── index.tsx         # Listado con búsqueda por nombre o ingrediente
│   └── favoritas.tsx     # Recetas favoritas
└── receta/
    ├── nueva.tsx         # Formulario de creación/edición (ingredientes y pasos dinámicos, foto)
    └── [id].tsx          # Detalle con porciones ajustables + modo cocina
src/
├── db/                   # Apertura de SQLite y migraciones (PRAGMA user_version)
├── repositories/         # SQL parametrizado y transacciones (CRUD + sincronización)
├── services/             # Reglas de negocio (validación, escalado) + sincronización
├── api/                  # Cliente HTTP (fetch + Bearer + refresh), auth e imágenes
├── sensors/              # Hooks desacoplados (useShake, useSpeech)
├── context/              # SessionProvider (estado de sesión)
├── utils/                # Funciones puras (escalar cantidades, validaciones, UUID)
├── components/           # UI reutilizable y accesible
├── constants/            # Tema (colores, espaciado, tipografía)
└── types/                # Modelo de dominio
```

## Funcionalidades

- **CRUD de recetas** con lista dinámica de ingredientes y pasos (RF-01).
- **Búsqueda** por nombre o por ingrediente (RF-02).
- **Favoritas** (RF-03): doble toque o botón estrella.
- **Ajuste de porciones** con recálculo de cantidades (RF-04).
- **Transacción**: receta e ingredientes se guardan juntos o ninguno (RF-05).
- **Modo cocina** (RF-06): pasos grandes, pantalla siempre encendida, leer en voz alta, agitar para avanzar.
- **Gestos** (todos con alternativa accesible por botón):
  - Pellizco → zoom de la foto.
  - Deslizar horizontal → paso siguiente/anterior en modo cocina.
  - Doble toque → marcar favorita.
  - Pulsación larga en un ingrediente → tacharlo.
- **Sensores** (siempre con `isAvailableAsync()` y alternativa):
  - Acelerómetro → agitar para avanzar de paso.
  - Cámara/galería → foto del plato (se reduce con `expo-image-manipulator`).
  - `expo-keep-awake` → pantalla encendida en modo cocina.
  - `expo-speech` → leer el paso en voz alta.

## Seguridad

- La app **no contiene credenciales**: no hay `firebaseConfig` ni claves. Solo conoce `EXPO_PUBLIC_API_URL`.
- Los tokens se guardan en **expo-secure-store** (nunca en AsyncStorage).
- `.env` y `.env.*` están en `.gitignore` (`.env.example` sí se versiona).
- El cliente HTTP renueva el token una sola vez ante un `401` y reintenta; si falla, cierra sesión.

## Sincronización (offline-first)

La app escribe primero en SQLite con `pending = 1`. `src/services/syncService.ts` envía los pendientes
(`PUT` / `DELETE`) cuando hay conexión y luego pide `?since=` para traer cambios. Los conflictos los
resuelve el servidor por `updated_at` (gana la última escritura). La sincronización es un no-op si
`EXPO_PUBLIC_API_URL` no está configurada.

## Pruebas

```bash
npm test
```

Cubre: `escalar()` (escalado de cantidades), validaciones, lógica pura del acelerómetro, la transacción
con **rollback ante error** y el componente de ingredientes (agregar/quitar filas).
