# AGENTS.md — 07-recetario-familiar-app

## 1. Propósito y alcance
Aplicación móvil offline-first en React Native + Expo para gestionar un recetario familiar con sincronización hacia una API REST propia.
- **Regla de alcance:** Proyecto atómico. Implementa únicamente los requisitos especificados aquí y en `07-recetario-familiar.md` antes de añadir funcionalidades extra.
- **Límite de entorno:** Trabaja exclusivamente dentro de la raíz de este repositorio (`07-recetario-familiar-app`).

## 2. Stack tecnológico
- **Framework:** Expo (SDK actual) + React Native + TypeScript estricto + Expo Router.
- **Persistencia local:** `expo-sqlite` (fuente de verdad local) + `expo-secure-store` (tokens de sesión).
- **Gestos y animaciones:** `react-native-gesture-handler` + `react-native-reanimated`.
- **Hardware y media:** `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-keep-awake`, `expo-sensors`, `expo-speech`.
- **Pruebas:** Jest + `jest-expo` + React Native Testing Library.

## 3. Comandos del proyecto
- Iniciar servidor de desarrollo: `npx expo start`
- Ejecutar pruebas: `npx jest`
- Verificar tipos TypeScript: `npx tsc --noEmit`
- Linter: `npx expo lint`

## 4. Estructura de carpetas
```text
app/
├── _layout.tsx            # Stack/Tabs, GestureHandlerRootView, proveedor de sesión
├── (tabs)/
│   ├── index.tsx          # Listado de recetas con búsqueda por nombre o ingrediente
│   └── favoritas.tsx      # Recetas marcadas como favoritas
└── receta/
    ├── nueva.tsx          # Formulario de creación/edición con ingredientes dinámicos
    └── [id].tsx           # Detalle con ajuste de porciones y modo cocina
src/
├── db/                    # Inicialización de SQLite y migraciones
├── repositories/          # Consultas SQL parametrizadas y transacciones
├── services/              # Reglas de negocio (escalado, validaciones) y sincronización
├── api/                   # Cliente HTTP (fetch, manejo de Bearer token, refresh y errores)
├── sensors/               # Hooks desacoplados para sensores (useShake, etc.)
├── utils/                 # Funciones puras (ej. escalar cantidades)
└── components/            # Componentes UI reutilizables y accesibles