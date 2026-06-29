# FEMA App — Planificador de OTs

Dashboard de tareas pendientes conectado a Fracttal One · Instancia 371.

---

## ¿Qué hace esta app?

- Muestra las tareas pendientes de **FEMA - Transportes de Carga FEMA S.A. de C.V.**
- Se conecta a Fracttal usando tu consumidor OAuth "FEMA APP"
- Filtra automáticamente por la jerarquía de FEMA (no muestra datos de otras empresas)
- Tiene botón de actualización en tiempo real
- Es la base para crear órdenes de trabajo directamente desde aquí

---

## Cómo subir a GitHub y Railway (paso a paso)

### Paso 1 — Subir el código a GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Clic en **"New repository"** (botón verde)
3. Nombre: `fema-app`
4. Selecciona **Private** (privado, para que nadie más lo vea)
5. Clic en **"Create repository"**
6. GitHub te mostrará instrucciones. Copia y ejecuta en tu computadora:

```bash
git init
git add .
git commit -m "Primera versión FEMA App"
git remote add origin https://github.com/TU_USUARIO/fema-app.git
git push -u origin main
```

### Paso 2 — Conectar Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión con tu cuenta de GitHub
2. Clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige `fema-app`
5. Railway detectará automáticamente el proyecto

### Paso 3 — Configurar las variables de entorno en Railway

En Railway, ve a tu proyecto → **Variables** y agrega:

| Variable | Valor |
|---|---|
| `FRACTTAL_CLIENT_ID` | `C1vZ21rJ4Ar7W7Eg7g` |
| `FRACTTAL_CLIENT_SECRET` | `HjSkZbfVsebrJ41WbNXzKZSvHyukQYcc` |
| `FRACTTAL_BASE_URL` | `https://one.fracttal.com` |
| `FEMA_LOCATION_ID` | `48905423` |
| `FEMA_PATH_NODE` | `46128370.48905423` |
| `NODE_ENV` | `production` |

### Paso 4 — Deploy

Railway construirá y desplegará la app automáticamente.
Te dará una URL pública como: `https://fema-app.up.railway.app`

---

## Estructura del proyecto

```
fema-app/
├── server/
│   └── index.js          ← Backend: obtiene token y llama a Fracttal
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── Header.js
│       │   ├── Sidebar.js       ← Lista de tareas pendientes
│       │   ├── TareaCard.js     ← Tarjeta individual
│       │   └── PanelCentral.js  ← Panel derecho (futuras funciones)
│       ├── hooks/
│       │   └── useTareasPendientes.js
│       └── utils/
│           └── formato.js
├── .env.example           ← Ejemplo de variables (sin secretos)
├── .gitignore             ← Evita subir .env a GitHub
├── package.json
└── railway.toml           ← Configuración de Railway
```

---

## Próximas funcionalidades planeadas

- [ ] Crear órdenes de trabajo desde la app
- [ ] Ver OTs en proceso, en revisión y finalizadas (Kanban completo)
- [ ] Asignación de técnicos
- [ ] Notificaciones de tareas atrasadas
- [ ] App móvil

---

## Importante — Seguridad

- El archivo `.env` **nunca** se sube a GitHub (está en `.gitignore`)
- Las credenciales van solo en las **Variables de Railway**
- El backend actúa como intermediario — el cliente (navegador) nunca ve el `client_secret`
