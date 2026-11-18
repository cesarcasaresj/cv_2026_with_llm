# Publicar en cesarcasares.com (hosting compartido de Namecheap con cPanel)

Guía paso a paso para publicar el CV en un hosting compartido con **Setup Node.js App**, **PostgreSQL Databases** y **SSH**.
Se hace una vez; después, cada cambio que llega a `main` se publica solo (GitHub Actions).

## Cómo queda montado

```
cesarcasares.com       → App Node "cv-web": el frontend con SSR (la página)
api.cesarcasares.com   → App Node "cv-api": el backend (la API)
PostgreSQL             → la base de datos del plan, creada en cPanel
Secretos               → variables de entorno de cada app en cPanel (SECRETS_PROVIDER=env)
Despliegue             → GitHub Actions: pruebas, compilación, subida por SSH y reinicio
```

**Por qué no hay Vault en producción:** un hosting compartido no permite servicios propios corriendo siempre, y Vault lo necesita.
La constitución lo recoge como excepción (sección 2): los secretos van en las variables de entorno del panel, nunca en el código ni en git.
En desarrollo se sigue usando Vault. Si algún día pasas a un VPS, basta con volver a `SECRETS_PROVIDER=vault`.

**Por qué se compila en GitHub y no en el hosting:** compilar Angular necesita más memoria de la que da un plan compartido.
Al servidor solo llegan archivos listos: el backend en un único archivo (`dist/server.mjs`, sin `node_modules`), sus migraciones y el frontend compilado.

---

## 1. Respaldo del sitio actual

1. cPanel → **File Manager** → `public_html`.
2. Selecciona todo → **Compress** → descarga el ZIP. Es tu CV antiguo, por si quieres volver.
3. Mueve el contenido de `public_html` a una carpeta `public_html_antiguo` (fuera de `public_html`), para que no interfiera.

## 2. Subdominio para la API

1. cPanel → **Domains** → **Create A New Domain** → `api.cesarcasares.com`.
   **Desmarca "Share document root"**: si comparte `public_html`, cPanel lo crea como alias y las dos apps chocan.
2. El DNS está en Namecheap, no en cPanel: **Domain List → Manage → Advanced DNS → Add New Record** →
   `A Record`, host `api`, valor = la **Shared IP Address** de cPanel (recuadro *General Information*).

**HTTPS:** Namecheap no tiene el botón "Run AutoSSL", pero emite solo el certificado de un subdominio nuevo unos minutos
después de que su registro DNS apunte al servidor. Compruébalo antes de seguir: `https://api.cesarcasares.com` debe mostrar un
certificado a nombre de `api.cesarcasares.com` (no el genérico `*.web-hosting.com`). Deja activado **Force HTTPS Redirect**.
Los visitantes nunca usan el subdominio: todo pasa por `https://cesarcasares.com/api`, que el frontend reenvía al backend.

## 3. Base de datos PostgreSQL

1. cPanel → **PostgreSQL Databases**.
2. **Create New Database**: por ejemplo `cvapp` (cPanel le pone tu usuario delante: `tuusuario_cvapp`).
3. **Add New User**: por ejemplo `cvapp` (queda `tuusuario_cvapp`) con una contraseña larga generada con el botón del panel.
   Guárdala en tu gestor de contraseñas: la necesitarás en el paso 5 y en el 8.
4. **Add User to Database**: ese usuario en esa base, con **todos los privilegios**.

No hace falta crear tablas: el backend aplica las migraciones (`backend/db/init`) la primera vez que arranca.

## 4. Acceso SSH para GitHub

En tu PC (PowerShell), crea una llave solo para el despliegue, **sin frase de paso**:

```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\cesarcasares_deploy" -C "despliegue cesarcasares.com"
```

1. cPanel → **Manage Shell** → **Enable SSH Access** (en Namecheap viene apagado).
2. cPanel → **SSH Access** → **Manage SSH Keys** → **Import Key** → pega el contenido de `cesarcasares_deploy.pub` → **Import**.
3. En la lista, junto a la llave → **Manage** → **Authorize**.
4. Prueba la conexión: puerto **21098**, tu usuario de cPanel y la **Shared IP Address** de cPanel.
   No uses el dominio: pasa por el intermediario HTTPS de Namecheap, que no acepta SSH.

```powershell
ssh -p 21098 -i "$HOME\.ssh\cesarcasares_deploy" tuusuario@<shared-ip>
```

Si entra, escribe `exit`. Guarda también la huella del servidor para GitHub:

```powershell
ssh-keyscan -p 21098 <shared-ip>
```

## 5. Las dos apps de Node.js

cPanel → **Setup Node.js App** → **Create Application**, dos veces:

| Campo | Backend | Frontend |
|---|---|---|
| Node.js version | 22 (o la más alta ≥ 20) | la misma |
| Application mode | Production | Production |
| Application root | `cv-api` | `cv-web` |
| Application URL | `api.cesarcasares.com` | `cesarcasares.com` |
| Application startup file | `app.cjs` | `app.cjs` |

En cada app, en **Environment variables**, añade estas (los valores entre `<>` son tuyos):

**cv-api (backend)**

| Variable | Valor |
|---|---|
| `SECRETS_PROVIDER` | `env` |
| `DATABASE_HOST` | `localhost` |
| `DATABASE_PORT` | `5432` |
| `DATABASE_DATABASE` | `<tuusuario_cvapp>` |
| `DATABASE_USERNAME` | `<tuusuario_cvapp>` |
| `DATABASE_PASSWORD` | `<la contraseña del paso 3>` |
| `JWT_SIGNING_KEY` | `<clave aleatoria, ver abajo>` |
| `RUN_MIGRATIONS_ON_START` | `true` |
| `PUBLIC_SITE_URL` | `https://cesarcasares.com` |
| `IMAGE_BASE_URL` | `/images/articulos` |
| `GITHUB_USERNAME` | `<tu usuario de GitHub>` |
| `LINKEDIN_PROFILE_URL` | `https://www.linkedin.com/in/cesarcasaresse/` |

Para `JWT_SIGNING_KEY`, genera una clave aleatoria segura en PowerShell y pégala (no la guardes en ningún archivo):

```powershell
$bytes = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

**cv-web (frontend)**

| Variable | Valor |
|---|---|
| `BACKEND_URL` | `https://api.cesarcasares.com` |
| `PUBLIC_SITE_URL` | `https://cesarcasares.com` |
| `ALLOWED_HOSTS` | `cesarcasares.com,www.cesarcasares.com` |

Pulsa **Save** en cada una. Todavía no las arranques: aún no tienen archivos (los sube GitHub en el paso 7).

**Comprueba que cada app quedó en su dominio.** Si `api.cesarcasares.com` fue alguna vez un alias, cPanel puede registrar las dos
apps en `cesarcasares.com`. Por SSH, `cloudlinux-selector get --json --interpreter=nodejs` muestra el dominio de cada una, y
`cloudlinux-selector set --json --interpreter=nodejs --app-root=cv-api --new-domain=api.cesarcasares.com > /dev/null` lo corrige
(la salida se descarta porque incluye las variables de entorno). Después, `public_html/.htaccess` debe tener el bloque de **cv-web**
y `api.cesarcasares.com/.htaccess` el de **cv-api**; si falta uno, se copia el bloque de la otra app cambiando las rutas.

## 6. Secrets en GitHub

En el repositorio → **Settings** → **Secrets and variables** → **Actions**.

**Secrets** (pestaña *Secrets* → *New repository secret*):

| Nombre | Valor |
|---|---|
| `SSH_HOST` | la **Shared IP Address** de cPanel |
| `SSH_PORT` | `21098` |
| `SSH_USER` | tu usuario de cPanel |
| `SSH_PRIVATE_KEY` | el contenido completo de `cesarcasares_deploy` (la llave **privada**, sin `.pub`) |
| `SSH_KNOWN_HOSTS` | la salida de `ssh-keyscan` del paso 4 |
| `API_DIR` | `/home/<tuusuario>/cv-api` |
| `WEB_DIR` | `/home/<tuusuario>/cv-web` |

**Variables** (pestaña *Variables* → *New repository variable*):

| Nombre | Valor |
|---|---|
| `SITE_URL` | `https://cesarcasares.com` |

## 7. Primer despliegue

Haz merge del pull request a `main` (o en **Actions** → *Pruebas y despliegue* → **Run workflow**).
La acción ejecuta las pruebas, compila, sube los archivos y reinicia las dos apps. Al arrancar, el backend crea las tablas.

Al terminar, `https://cesarcasares.com` ya responde, aunque la portada dirá que no pudo cargar el perfil: falta el paso 8.

## 8. Cargar tus datos (una vez)

Los scripts de carga se ejecutan desde tu PC contra la base del hosting a través de un **túnel SSH** (la base no está abierta a Internet).

1. Abre el túnel en una terminal y déjala abierta:

   ```powershell
   ssh -p 21098 -i "$HOME\.ssh\cesarcasares_deploy" -N -L 6543:localhost:5432 tuusuario@<shared-ip>
   ```

2. En la raíz del repositorio, crea `.env.production.local` (git lo ignora; **nunca** lo subas):

   ```
   SECRETS_PROVIDER=env
   DATABASE_HOST=localhost
   DATABASE_PORT=6543
   DATABASE_DATABASE=tuusuario_cvapp
   DATABASE_USERNAME=tuusuario_cvapp
   DATABASE_PASSWORD=la-contraseña-del-paso-3
   ```

3. En otra terminal, desde `backend/`:

   ```powershell
   npm run prod -- scripts/load-profile.ts                         # tu perfil y experiencia
   $env:AUTHOR_PASSWORD = "<contraseña de al menos 12 caracteres>"
   $env:AUTHOR_NAME = "Cesar Casares"
   npm run prod -- scripts/create-user.ts <tu-correo>                # tu cuenta de autor
   npm run prod -- scripts/load-content.ts --author <tu-correo>      # los artículos del blog
   ```

4. Cierra el túnel (Ctrl + C) y borra la contraseña de la sesión: `Remove-Item Env:AUTHOR_PASSWORD`.

Si Namecheap no permite el túnel (`channel open failed` o similar), avísame: la carga se puede hacer desde el propio servidor.

## Después: publicar cambios

Haz merge a `main`. GitHub prueba, compila, sube y reinicia solo. Si las pruebas fallan, no se publica nada.
Para cambiar tus datos, edita `content/perfil/perfil.json` o los artículos y repite el paso 8 (solo el script que corresponda).

## Si algo falla

- **Ver errores de una app:** cPanel → File Manager → `cv-api/stderr.log` o `cv-web/stderr.log`.
  Los mensajes nunca muestran valores de secretos: dicen qué variable falta (por ejemplo `SECRET_MISSING: no hay variables DATABASE_*`).
- **Reiniciar a mano:** cPanel → Setup Node.js App → **Restart** en la app.
- **El despliegue falla en "Configurar SSH" o "Subir":** revisa `SSH_PRIVATE_KEY` (completa, con sus líneas `BEGIN`/`END`) y `SSH_KNOWN_HOSTS`.
- **Volver al sitio antiguo:** detén las apps en Setup Node.js App y devuelve los archivos de `public_html_antiguo` a `public_html`.
