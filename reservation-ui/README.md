# Sistema de Reservas - Frontend (Reservation UI)

Aplicacion web cliente para la gestion y programacion de citas en tiempo real. Desarrollada con React 19, TypeScript y Vite, e integrada con un backend en ASP.NET Core mediante APIs REST y comunicacion bidireccional continua a traves de SignalR.

---

## Tabla de Contenidos

1. [Descripcion del Proyecto](#descripcion-del-proyecto)
2. [Arquitectura y Tecnologias](#arquitectura-y-tecnologias)
3. [Caracteristicas Principales](#caracteristicas-principales)
4. [Seguridad y Variables de Entorno](#seguridad-y-variables-de-entorno)
5. [Requisitos del Sistema](#requisitos-del-sistema)
6. [Guia de Instalacion y Ejecucion Local](#guia-de-instalacion-y-ejecucion-local)
   - [Paso 1: Clonar el Repositorio](#paso-1-clonar-el-repositorio)
   - [Paso 2: Configuracion de Variables de Entorno](#paso-2-configuracion-de-variables-de-entorno)
   - [Paso 3: Instalacion de Dependencias](#paso-3-instalacion-de-dependencias)
   - [Paso 4: Ejecucion del Backend (.NET)](#paso-4-ejecucion-del-backend-net)
   - [Paso 5: Ejecucion del Frontend en Desarrollo](#paso-5-ejecucion-del-frontend-en-desarrollo)
7. [Scripts Disponibles](#scripts-disponibles)
8. [Estructura del Proyecto](#estructura-del-proyecto)
9. [Compilacion para Produccion](#compilacion-para-produccion)

---

## Descripcion del Proyecto

El sistema ofrece una solucion integral para la administracion de citas y servicios. Permite a los operadores visualizar agendas semanales, mensuales y diarias, registrar nuevas citas evitando solapamientos horarios y recibir actualizaciones instantaneas en pantalla cada vez que un registro es creado o cancelado por cualquier usuario conectado.

La interfaz prioriza la usabilidad, la claridad operativa y el rendimiento, implementando un diseño de panel dividido (Dashboard) con el calendario interactivo a la izquierda y un panel de control cronologico de citas a la derecha.

---

## Arquitectura y Tecnologias

### Frontend
- **React 19**: Biblioteca base para la construccion de interfaces de usuario reactivas.
- **TypeScript**: Tipado estatico para robustez, prevencion de errores y mantenibilidad del codigo.
- **Vite**: Herramienta de compilacion y entorno de desarrollo de alto rendimiento.
- **React Big Calendar & date-fns**: Componente de calendario con localizacion completa al español.
- **@microsoft/signalr**: Cliente de WebSockets para recibir eventos del servidor en tiempo real.
- **Axios**: Cliente HTTP para interactuar con la API REST mediante un modulo centralizado.
- **React Hot Toast**: Sistema de notificaciones no bloqueantes para retroalimentacion operativa.

### Backend Asociado
- **ASP.NET Core Web API (.NET 10)**: Procesamiento de reglas de negocio, validaciones y persistencia.
- **Entity Framework Core & SQLite**: Capa de acceso a datos y base de datos relacional ligera.
- **SignalR Hub (`/reservationHub`)**: Difusion de eventos de creacion y cancelacion en tiempo real.

---

## Caracteristicas Principales

- **Calendario Multivista**: Navegacion por mes, semana, dia y agenda con formateo de fechas en español.
- **Sincronizacion en Tiempo Real**: Conexion continua con SignalR que actualiza la interfaz sin necesidad de recargar la pagina.
- **Indicador de Conexion en Vivo**: Distintivo visual en la barra superior que informa si el enlace SignalR esta activo o degradado.
- **Panel Cronologico de Citas**: Lista lateral que organiza las citas ordenadas por fecha y hora de inicio, con avatares calculados e insignias de estado (En curso, Proxima, Finalizada).
- **Filtros y Busqueda Dinamica**: Filtrado rapido por estado (Proximas, Hoy, Todas) y barra de busqueda por cliente o nombre de servicio.
- **Navegacion Directa**: Capacidad de hacer clic en cualquier cita del panel lateral para centrar el calendario en su fecha correspondiente.
- **Prevencion de Conflictos de Horario**: Restriccion contra reservas en horarios pasados y bloqueo de solapamiento implementado en frontend y validado en backend.
- **Confirmacion Segura de Cancelacion**: Flujo interactivo que previene cancelaciones accidentales mediante dialogos de confirmacion.

---

## Seguridad y Variables de Entorno

El proyecto implementa los protocolos de seguridad recomendados para aplicaciones cliente (SPA):

1. **Aislamiento de Secretos**: Ninguna clave de autenticacion (`API KEY`) ni direccion de servidor privada se encuentra fija (hardcoded) en el codigo fuente.
2. **Uso de Variables con Prefijo `VITE_`**: Vite restringe las variables expuestas al navegador unicamente a aquellas que inician con el prefijo `VITE_`.
3. **Control de Versionamiento (`.gitignore`)**: Los archivos `.env`, `.env.local` y equivalentes estan excluidos de Git para impedir filtraciones accidentales de credenciales al repositorio remoto.
4. **Plantilla de Configuracion (`.env.example`)**: Se provee un archivo plantilla versionado que documenta las variables requeridas sin contener valores sensibles.
5. **Inyeccion de Encabezados**: El cliente HTTP (`src/services/api.ts`) inyecta la cabecera `X-Api-Key` de forma condicional solo si la variable `VITE_API_KEY` esta configurada en el entorno.

### Variables Disponibles

| Variable | Descripcion | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL del endpoint REST para la gestion de citas | `http://localhost:5170/api/appointments` |
| `VITE_API_KEY` | Clave de acceso a la API (opcional, segun requerimientos del servidor) | `(Vacio en desarrollo local)` |

---

## Requisitos del Sistema

Antes de iniciar la instalacion, asegurese de contar con las siguientes herramientas instaladas en su equipo:

- **Node.js**: Version 18.0.0 o superior (se recomienda LTS 20.x o 22.x).
- **npm**: Version 9.0.0 o superior (incluido con Node.js).
- **.NET SDK**: Version 10.0 (o runtime compatible) para compilar y ejecutar la API backend.
- **Git**: Para clonar y gestionar el repositorio de codigo.

---

## Guia de Instalacion y Ejecucion Local

Siga los pasos detallados a continuacion para poner en marcha el sistema completo en un entorno local.

### Paso 1: Clonar el Repositorio

Abra una terminal y clone el repositorio en su directorio de trabajo:

```bash
git clone https://github.com/Emerson-1111/reservation-ui.git
cd reservation-ui
```

### Paso 2: Configuracion de Variables de Entorno

Genere el archivo `.env` local a partir del archivo de ejemplo `.env.example`:

En Linux / macOS / Git Bash:
```bash
cp .env.example .env
```

En Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

En Windows (CMD):
```cmd
copy .env.example .env
```

Abra el archivo `.env` y configure las variables segun su entorno local:

```env
# URL del backend local de citas
VITE_API_URL=http://localhost:5170/api/appointments

# Clave de autenticacion (deje vacio si no requiere API Key en desarrollo)
VITE_API_KEY=
```

### Paso 3: Instalacion de Dependencias

Ejecute el gestor de paquetes para descargar e instalar todas las dependencias del frontend:

```bash
npm install
```

### Paso 4: Ejecucion del Backend (.NET)

Para que el sistema funcione en su totalidad (lectura de citas, persistencia en base de datos y eventos en tiempo real), inicie la API de backend ubicada en la carpeta paralela `ReservationApi`:

1. Abra una nueva terminal y ubiquese en el directorio del backend:

```bash
cd ../ReservationApi
```

2. Restaure las dependencias del proyecto .NET:

```bash
dotnet restore
```

3. Inicie el servidor backend:

```bash
dotnet run
```

La API quedara disponible en `http://localhost:5170` (o el puerto configurado en `Properties/launchSettings.json`).

### Paso 5: Ejecucion del Frontend en Desarrollo

Regrese a la terminal del proyecto `reservation-ui` y ejecute:

```bash
npm run dev
```

La aplicacion iniciara el servidor de desarrollo de Vite y mostrara una salida similar a la siguiente:

```
  VITE v8.3.2  ready in 300 ms

  -> Local:   http://localhost:5173/
  -> Network: use --host to expose
```

Abra su navegador e ingrese a `http://localhost:5173`. Verifique que el indicador de estado en la esquina superior derecha muestre el distintivo verde indicando la conexion exitosa a SignalR.

---

## Scripts Disponibles

En el directorio del frontend puede ejecutar los siguientes comandos:

| Comando | Descripcion |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Hot Module Replacement (HMR). |
| `npm run build` | Compila TypeScript y empaqueta la aplicacion optimizada para produccion en la carpeta `dist/`. |
| `npm run lint` | Ejecuta ESLint para analizar la calidad y consistencia del codigo fuente. |
| `npm run preview` | Levanta un servidor local para previsualizar los archivos generados en produccion. |

---

## Estructura del Proyecto

```
reservation-ui/
├── public/                     # Archivos estaticos e iconos publicos
│   └── favicon.svg
├── src/
│   ├── assets/                 # Recursos graficos del proyecto
│   ├── components/             # Componentes modulares de interfaz
│   │   ├── AppointmentsList.tsx # Panel lateral cronologico, filtros y busqueda
│   │   └── ReservationModal.tsx # Ventana modal para captura de citas
│   ├── services/               # Capa de integracion y llamadas a red
│   │   └── api.ts              # Cliente Axios seguro, SignalR URLs y endpoints
│   ├── App.css                 # Estilos especificos del contenedor principal
│   ├── App.tsx                 # Vista principal del Dashboard y logica SignalR
│   ├── index.css               # Sistema de diseño, variables CSS y estilos del calendario
│   ├── main.tsx                # Punto de entrada de la aplicacion React
│   └── vite-env.d.ts           # Definiciones de tipos para variables de entorno
├── .env.example                # Plantilla de variables de entorno para desarrollo
├── .gitignore                  # Exclusion de artefactos, dependencias y archivos .env
├── eslint.config.js            # Configuracion de reglas de linter
├── index.html                  # Plantilla HTML base
├── package.json                # Definicion de dependencias y scripts
├── tsconfig.json               # Configuracion de compilador TypeScript
└── vite.config.ts              # Configuracion de empaquetado y plugins de Vite
```

---

## Compilacion para Produccion

Para generar la version de produccion lista para ser servida desde un servidor web estatico (como Nginx, Apache, Cloudflare Pages o AWS S3):

```bash
npm run build
```

El resultado se almacenara en el directorio `dist/`. Puede probar localmente el artefacto resultante antes del despliegue ejecutando:

```bash
npm run preview
```
