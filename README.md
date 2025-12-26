# 🌍 Multilangue+ Platform

¡Bienvenido a **Multilangue+**! Esta es una plataforma educativa integral diseñada para la gestión y enseñanza de idiomas. El sistema permite la interacción en tiempo real entre profesores y estudiantes, gestión de cursos, asistencia, materiales y actividades interactivas.

---

## 🚀 Características Principales

### 👥 Gestión de Roles
El sistema maneja tres tipos de usuarios, cada uno con permisos específicos:
*   **ADMIN**: Control total del sistema. Puede crear usuarios, cursos, asignar profesores, ver todas las estadísticas y gestionar la asistencia global.
*   **PROFESOR**: Puede gestionar sus cursos asignados, subir materiales, tomar asistencia, crear actividades y realizar videollamadas.
*   **ESTUDIANTE**: Acceso a sus cursos matriculados, visualización de materiales, participación en videollamadas y consulta de su historial de asistencia.

### 📚 Funcionalidades del Aula Virtual
Cada curso cuenta con un aula virtual completa que incluye:
1.  **Videollamadas en Vivo**: Integración WebRTC para clases en tiempo real con video, audio y chat.
2.  **Materiales**: Repositorio de archivos donde los profesores pueden subir PDFs, imágenes y documentos. Los estudiantes pueden visualizarlos (modo lectura) o descargarlos.
3.  **Grabaciones**: Acceso a las grabaciones de clases anteriores.
4.  **Actividades**:
    *   **Dinámico**: Para cursos de **Francés A1**, se muestra automáticamente una cuadrícula de unidades (Unité 0 - Unité 6).
    *   Para otros cursos, se muestra un mensaje de "Próximamente".
5.  **Asistencia**:
    *   **Toma de Lista**: Interfaz rápida para que el profesor marque Presente, Ausente o Tarde.
    *   **Historial**: Panel lateral que muestra todas las fechas anteriores. Permite consultar listas pasadas en "Modo Lectura" (no editable) para mayor seguridad.

---

## 🛠️ Stack Tecnológico

El proyecto está construido con tecnologías modernas y robustas:

*   **Backend**: Node.js + Express
*   **Base de Datos**: MySQL (Relacional)
*   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
*   **Tiempo Real**: Socket.io (Chat y señalización WebRTC)
*   **Video**: WebRTC (Peer-to-Peer)

---

## 📂 Estructura del Proyecto

```text
2multilangue/
├── config/             # Configuración de base de datos (db.js)
├── controllers/        # Lógica de negocio (authController, courseController, etc.)
├── middleware/         # Middlewares (autenticación JWT, subida de archivos)
├── models/             # Modelos de datos (opcional, si se usa ORM o separacion)
├── public/             # Archivos estáticos del Frontend
│   ├── css/            # Estilos (style.css, video_room.css)
│   ├── js/             # Lógica cliente (app.js, webrtc.js, api.js)
│   ├── uploads/        # Archivos subidos (materiales, grabaciones)
│   └── index.html      # Punto de entrada (SPA)
├── routes/             # Definición de rutas API
├── sockets/            # Manejadores de eventos Socket.io
├── database.sql        # Script de creación de base de datos y tablas
├── server.js           # Punto de entrada del servidor
└── package.json        # Dependencias y scripts
```

---

## ⚙️ Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto en tu entorno local. No perderás datos si sigues estas instrucciones, ya que la base de datos es persistente.

### 1. Prerrequisitos
*   Node.js instalado (v14 o superior).
*   MySQL Server instalado y corriendo.

### 2. Configuración de Base de Datos
1.  Crea una base de datos vacía en MySQL (ej. `multilangue_db`).
2.  Importa el esquema:
    *   Puedes abrir `database.sql` y ejecutar su contenido en tu gestor de base de datos (Workbench, PHPMyAdmin, DBeaver).
    *   **Nota**: Este archivo contiene la estructura de tablas para `users`, `courses`, `materials`, `attendance`, etc.

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con la siguiente configuración:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=multilangue_db
JWT_SECRET=tu_secreto_super_seguro
PORT=3000
```

### 4. Instalación de Dependencias
Abre la terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 5. Ejecución
Para iniciar el servidor en modo desarrollo (se reinicia con cambios):
```bash
npm run dev
```
O para producción:
```bash
npm start
```

Abre tu navegador en `http://localhost:3000`.

---

## 🛡️ Seguridad y Persistencia

*   **Base de Datos**: Toda la información crítica (usuarios, cursos, asistencia, metadatos de archivos) se guarda en MySQL. Asegúrate de respaldar tu base de datos regularmente.
*   **Archivos**: Los documentos y videos se guardan en la carpeta `public/uploads`. **No borres esta carpeta** si quieres conservar los archivos subidos.
*   **Código**: El código fuente está modularizado. Al hacer cambios en `controllers` o `public/js`, asegúrate de reiniciar el servidor (si no usas `npm run dev`) para ver los cambios.

---

## ✨ Notas para el Desarrollador

*   **Idempotencia**: El script `database.sql` usa `CREATE TABLE IF NOT EXISTS`, por lo que puedes ejecutarlo múltiples veces sin borrar datos existentes (a menos que hagas un `DROP`).
*   **Nuevas Tablas**: Si agregas funcionalidades, añade siempre la definición de la tabla correspondiente al final de `database.sql` para mantener un registro histórico del esquema.
*   **Materiales**: La tabla `materials` ha sido añadida recientemente para soportar la subida de recursos por parte de los profesores.

---

**¡Disfruta construyendo y aprendiendo con Multilangue+!**
