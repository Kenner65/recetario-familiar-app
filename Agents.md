# AGENTS.md — 07-recetario-familiar-app

## 1. Propósito y alcance
Aplicación móvil offline-first en React Native + Expo para gestionar un recetario familiar con sincronización hacia una API REST propia (Next.js + Firebase).
- **Regla de alcance:** Proyecto atómico. Implementa únicamente los requisitos de `07-recetario-familiar.md` antes de añadir funcionalidades extra.
- **Límite de entorno:** Trabaja exclusivamente dentro de la raíz de este repositorio (`07-recetario-familiar-app`). No leer ni escribir fuera de esta carpeta.

## 2. Stack tecnológico
- **Framework:** Expo SDK 58 + React Native + TypeScript estricto + Expo Router.
- **Persistencia local:** `expo-sqlite` (fuente de verdad local) + `expo-secure-store` (tokens de sesión).
- **Gestos y animaciones:** `react-native-gesture-handler` + `react-native-reanimated`.
- **Hardware y media:** `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-keep-awake`, `expo-sensors`, `expo-speech`.
- **Pruebas:** Jest + `jest-expo` + React Native Testing Library.

## 3. Comandos del proyecto
- Iniciar servidor de desarrollo: `npm start` (o `npx expo start`)
- Ejecutar pruebas: `npm test` (o `npx jest`)
- Verificar tipos TypeScript: `npm run typecheck` (o `npx tsc --noEmit`)
- Linter: `npm run lint` (o `npx expo lint`)

## 4. Estructura de carpetas
```text
app/                      # Rutas de Expo Router
├── _layout.tsx           # Stack raíz + GestureHandlerRootView + SessionProvider
├── (tabs)/
│   ├── _layout.tsx       # Tabs (Recetas / Favoritas)
│   ├── index.tsx         # Listado con búsqueda por nombre o ingrediente
│   └── favoritas.tsx     # Recetas marcadas como favoritas
└── receta/
    ├── nueva.tsx         # Formulario de creación/edición con ingredientes dinámicos
    └── [id].tsx          # Detalle con ajuste de porciones y modo cocina
src/
├── db/                   # Apertura de SQLite y migraciones (PRAGMA user_version)
├── repositories/         # Consultas SQL parametrizadas y transacciones (CRUD + sync)
├── services/             # Reglas de negocio (escalado, validaciones) y sincronización
├── api/                  # Cliente HTTP (fetch, Bearer token, refresh y errores), auth e imágenes
├── sensors/              # Hooks desacoplados para sensores (useShake, useSpeech)
├── context/              # SessionProvider (estado de sesión)
├── utils/                # Funciones puras (ej. escalar cantidades)
├── components/           # Componentes UI reutilizables y accesibles
├── constants/            # Tema (colores, espaciado, tipografía)
└── types/                # Modelo de dominio
```

## 5. Convenciones de código
- TypeScript estricto (`strict` + `noUncheckedIndexedAccess`). No usar `any` sin justificación.
- SQL siempre **parametrizado** (nunca concatenar valores). Transacciones con `withTransactionSync`.
- Los sensores se llaman tras `isAvailableAsync()` y cancelan sus suscripciones al desmontar.
- Lógica pura separada de la lectura del sensor (para poder probarla con mocks).
- Componentes accesibles: toda acción por gesto tiene alternativa por botón con `accessibilityLabel`.

## 6. Restricciones de seguridad (para la IA y para el equipo)
- **No leer** `.env`, `.env.*`, keystores (`*.jks`, `*.p8`, `*.p12`, `*.key`), `*.pem` ni credenciales. Están en `.gitignore` y solo viven en Vercel.
- **No salir de la carpeta** del repositorio.
- La app **no contiene credenciales**: no hay `firebaseConfig` ni claves. Solo `EXPO_PUBLIC_API_URL`.
- Los tokens de sesión van en `expo-secure-store`, nunca en `AsyncStorage`.
- Acciones con efecto fuera de la máquina (deploy, push a remoto, `vercel`, `eas`) requieren permiso explícito.
- Antes de entregar: buscar secretos con `grep -r` y revisar el bundle (ningún `EXPO_PUBLIC_` que sea secreto).
