# Agenda de Citas

Sistema integral para la administracion y programacion de citas en tiempo real. Esta solucion integra un backend robusto en ASP.NET Core con persistencia en SQLite y comunicacion bidireccional mediante SignalR, junto con una aplicacion web cliente desarrollada con React 19, TypeScript y Vite.

---

## Tabla de Contenidos

1. [Descripcion del Proyecto](#descripcion-del-proyecto)
2. [Estructura de la Solucion](#estructura-de-la-solucion)
3. [Arquitectura y Tecnologias](#arquitectura-y-tecnologias)
4. [Caracteristicas del Sistema](#caracteristicas-del-sistema)
5. [Seguridad y Variables de Entorno](#seguridad-y-variables-de-entorno)
6. [Requisitos Previos](#requisitos-previos)
7. [Guia de Instalacion y Ejecucion Local](#guia-de-instalacion-y-ejecucion-local)
   - [Paso 1: Clonar el Repositorio](#paso-1-clonar-el-repositorio)
   - [Paso 2: Ejecucion del Backend (ASP.NET Core)](#paso-2-ejecucion-del-backend-aspnet-core)
   - [Paso 3: Configuracion y Ejecucion del Frontend (React + Vite)](#paso-3-configuracion-y-ejecucion-del-frontend-react--vite)
8. [Endpoints y Protocolos de Comunicacion](#endpoints-y-protocolos-de-comunicacion)
9. [Comandos y Scripts Utiles](#comandos-y-scripts-utiles)
10. [Buenas Practicas de Seguridad](#buenas-practicas-de-seguridad)

---

## Descripcion del Proyecto

Agenda de Citas es una plataforma diseñada para gestionar reservas de servicios y atencion a clientes de forma colaborativa y sincronizada. Cada vez que una cita se crea o cancela, la interfaz de todos los usuarios conectados se actualiza de manera inmediata sin necesidad de refrescar la pagina, garantizando consistencia en la disponibilidad de horarios.

La aplicacion frontend presenta una vista de panel (Dashboard) dividida en dos componentes principales:
- Un calendario interactivo con localizacion al español y navegacion por mes, semana, dia y agenda.
- Una barra lateral cronologica con tarjetas de cita, avatares distintivos por cliente, indicadores de estado en vivo (En curso, Proxima, Finalizada), herramientas de busqueda y navegacion directa al dia de la cita en el calendario.

---

## Estructura de la Solucion

El repositorio se compone de dos modulos independientes y desacoplados:

```
agenda-de-citas/
├── ReservationApi/              # Backend Web API en ASP.NET Core
│   ├── Controllers/             # Controladores RESTful (AppointmentsController.cs)
│   ├── Data/                    # Contexto de base de datos (AppDbContext.cs)
│   ├── Hubs/                    # Servidor WebSocket SignalR (ReservationHub.cs)
│   ├── Migrations/              # Migraciones de Entity Framework Core
│   ├── Models/                  # Modelos de dominio (Appointment.cs)
│   ├── Program.cs               # Configuracion de servicios, CORS, SignalR y DB
│   └── appsettings.json         # Cadenas de conexion y configuracion del servidor
├── reservation-ui/              # Frontend SPA en React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/          # AppointmentsList.tsx, ReservationModal.tsx
│   │   ├── services/            # Cliente Axios seguro, SignalR URLs (api.ts)
│   │   ├── App.tsx              # Vista principal del Dashboard y eventos SignalR
│   │   ├── index.css            # Estilos globales y personalizacion del calendario
│   │   └── vite-env.d.ts        # Tipado de variables de entorno
│   ├── .env.example             # Plantilla de variables de entorno
│   └── package.json             # Dependencias y scripts de desarrollo
├── SistemaReservas.slnx         # Archivo de solucion de .NET
└── README.md                    # Documentacion principal del proyecto
```

---

## Arquitectura y Tecnologias

### Capa de Backend (`ReservationApi`)
- **ASP.NET Core Web API (.NET 10)**: Framework principal para servicios web de alto rendimiento.
- **Entity Framework Core 10 & SQLite**: ORM para gestion de datos relacionales y migraciones automaticas.
- **SignalR (`/reservationHub`)**: Envio de eventos push en tiempo real a clientes web conectados.
- **CORS Configurado**: Politicas adaptables para permitir comunicacion segura con clientes Vite en desarrollo.

### Capa de Frontend (`reservation-ui`)
- **React 19**: Biblioteca para construir interfaces reactivas y componentes desacoplados.
- **TypeScript**: Tipado estatico para minimizar errores en tiempo de ejecucion.
- **Vite**: Entorno de compilacion ultrarrapido con recarga en caliente (HMR).
- **React Big Calendar & date-fns**: Visualizacion de agenda con soporte de cultura en español.
- **@microsoft/signalr**: Cliente WebSocket oficial para recepcion de eventos en vivo.
- **Axios**: Cliente HTTP para interaccion REST con arquitectura centralizada de seguridad.
- **React Hot Toast**: Notificaciones de estado, carga y confirmacion de acciones.

---

## Caracteristicas del Sistema

- **Sincronizacion Bidireccional en Tiempo Real**: Notificaciones instantaneas mediante SignalR ante creacion o eliminacion de citas.
- **Monitoreo de Estado de Conexion**: Distintivo visual en la barra superior indicando el estado en vivo de la conexion con el servidor.
- **Prevencion de Colisiones de Horario**: Algoritmo en backend y validacion en modal para evitar que dos citas compartan un mismo intervalo de tiempo.
- **Restriccion de Horarios en Pasado**: Proteccion que impide registrar citas en fechas u horas que ya hayan transcurrido.
- **Panel Cronologico Lateral**:
  - Lista agrupada por fecha y ordenada cronologicamente por hora de inicio.
  - Insignias de estado dinamicas: "En curso" para eventos que ocurren en el momento actual, "Proxima cita" para el evento inmediato posterior, y marcas de tiempo relativo.
  - Busqueda instantanea por nombre de cliente o nombre de servicio.
  - Filtros rapidos: "Proximas", "Hoy" y "Todas".
  - Centrado del calendario con un solo clic sobre la tarjeta de cita.
- **Confirmacion de Cancelacion**: Alerta interactiva para evitar eliminaciones involuntarias.

---

## Seguridad y Variables de Entorno

El proyecto aplica las mejores practicas de seguridad en aplicaciones cliente y servidores web:

1. **Variables de Entorno con Prefijo `VITE_`**: Las variables consumidas por el cliente se gestionan a traves de `import.meta.env`.
2. **Sin Credenciales Expuestas**: Ninguna clave de acceso ni URL de infraestructura interna se encuentra escrita directamente en el codigo fuente.
3. **Exclusion de Archivos Sensibles**: El archivo `.gitignore` excluye `.env`, `.env.local` y artefactos de compilacion tanto de .NET (`bin/`, `obj/`, `*.db`) como de Node (`node_modules/`, `dist/`).
4. **Plantilla de Variables (`.env.example`)**: Provee una guia publica de las variables requeridas sin exponer valores reales.
5. **Inyeccion Segura de Cabeceras**: Si se provee la variable `VITE_API_KEY`, el servicio de red (`src/services/api.ts`) adjunta la cabecera `X-Api-Key` condicionalmente a las peticiones REST y al handshake de SignalR.

---

## Requisitos Previos

Antes de ejecutar el sistema, verifique que su entorno cuente con los siguientes componentes:

- **.NET SDK**: Version 10.0 o superior (instalar desde https://dotnet.microsoft.com/).
- **Node.js**: Version 18.0.0 o superior (recomendado Node.js LTS 20 o 22 desde https://nodejs.org/).
- **npm**: Version 9.0.0 o superior (incluido junto con Node.js).
- **Git**: Sistema de control de versiones.

---

## Guia de Instalacion y Ejecucion Local

Siga estos pasos para desplegar el entorno completo en su maquina local.

### Paso 1: Clonar el Repositorio

Abra una terminal y clone el proyecto:

```bash
git clone https://github.com/Emerson-1111/agenda-de-citas.git
cd agenda-de-citas
```

---

### Paso 2: Ejecucion del Backend (ASP.NET Core)

1. En una ventana de terminal, acceda a la carpeta del backend:

```bash
cd ReservationApi
```

2. Restaure los paquetes NuGet necesarios:

```bash
dotnet restore
```

3. Inicie el servidor API:

```bash
dotnet run
```

Al iniciar, la API aplicara automaticamente las migraciones pendientes en la base de datos SQLite (`reservations.db`) y quedara escuchando peticiones en:
- API REST: `http://localhost:5170/api/appointments`
- SignalR Hub: `http://localhost:5170/reservationHub`
- OpenAPI (Swagger): `http://localhost:5170/openapi/v1.json`

---

### Paso 3: Configuracion y Ejecucion del Frontend (React + Vite)

1. Abra una segunda terminal y navegue a la carpeta del cliente:

```bash
cd reservation-ui
```

2. Genere su archivo de configuracion local a partir de la plantilla:

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

3. Verifique el contenido de su archivo `.env`:

```env
# URL de la API local de reservas
VITE_API_URL=http://localhost:5170/api/appointments

# Clave de autenticacion (dejar vacio si no se requiere API Key en desarrollo local)
VITE_API_KEY=
```

4. Instale las dependencias de Node.js:

```bash
npm install
```

5. Inicie el servidor de desarrollo:

```bash
npm run dev
```

6. Abra su navegador web e ingrese a `http://localhost:5173`. Verifique que el indicador de estado superior muestre el distintivo verde con el mensaje "SignalR En vivo".

---

## Endpoints y Protocolos de Comunicacion

### Endpoints REST (`/api/appointments`)

| Metodo | Ruta | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/api/appointments` | Obtiene el listado de todas las citas agendadas. |
| `POST` | `/api/appointments` | Crea una nueva cita (valida solapamiento y fechas pasadas). |
| `DELETE` | `/api/appointments/{id}` | Elimina y cancela una cita por su identificador numerico. |

### Eventos de SignalR (`/reservationHub`)

| Evento | Direccion | Descripcion |
| :--- | :--- | :--- |
| `ReceiveNewAppointment` | Servidor -> Clientes | Emite el objeto de la cita recien creada a todos los usuarios conectados. |
| `ReceiveDeletedAppointment` | Servidor -> Clientes | Emite el ID numerico de la cita cancelada a todos los clientes para retirarla de la interfaz. |

---

## Comandos y Scripts Utiles

### Backend (`ReservationApi`)
- `dotnet run`: Inicia el servidor en modo desarrollo.
- `dotnet build`: Compila la solucion y verifica que no existan errores de sintaxis o dependencias.
- `dotnet test`: Ejecuta las pruebas unitarias o de integracion (si aplican).

### Frontend (`reservation-ui`)
- `npm run dev`: Inicia el servidor de desarrollo local con Vite (puerto 5173).
- `npm run build`: Compila TypeScript y genera el paquete de produccion en la carpeta `dist/`.
- `npm run lint`: Ejecuta el analizador estatico ESLint para garantizar consistencia de codigo.
- `npm run preview`: Previsualiza la version compilada de produccion localmente.

---

## Buenas Practicas de Seguridad

- Nunca desactive las politicas de CORS en entornos productivos; defina explícitamente los dominios de origen autorizados en `Program.cs`.
- No incluya archivos `.env` ni bases de datos con informacion sensible en el control de versiones.
- Al desplegar en produccion, utilice certificados SSL/TLS validos para habilitar HTTPS y conexiones seguras de WebSockets (WSS).
