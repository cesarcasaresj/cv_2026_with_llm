# Publicar en cesarcasares.com (VPS de Contabo con Docker)

Producción corre en un VPS propio (Contabo Cloud VPS 4, Ubuntu 24.04) con Docker Compose.
Se monta una vez; después, cada cambio que llega a `main` se publica solo (GitHub Actions).

**La IP del servidor no se escribe en este repositorio (es público):** está en el panel de Contabo y en el secret `SSH_HOST`.
Con el proxy de Cloudflare activado, los visitantes solo ven IPs de Cloudflare; mantenerla fuera del repositorio ayuda a que siga oculta.

## Cómo queda montado

```
Visitante → Cloudflare (DNS, caché, protección) → VPS <IP-del-VPS>
  caddy     HTTPS automático (Let's Encrypt), www → dominio principal       puertos 80 y 443
  web       frontend con SSR (node:22), reenvía /api, /sitemap.xml y /robots.txt al backend
  api       backend (node:22), aplica las migraciones al arrancar
  postgres  PostgreSQL 17, solo accesible desde el propio servidor (127.0.0.1:5432)
```

En el servidor todo vive en `/opt/cv` (usuario `deploy`):

| Archivo | Qué es | De dónde sale |
|---|---|---|
| `compose.yml`, `Caddyfile`, `backup.sh` | configuración | `deploy/vps/` del repositorio, la sube GitHub Actions |
| `release/api`, `release/web` | backend y frontend compilados | GitHub Actions en cada merge a `main` |
| `.env` | secretos y configuración (permisos 600) | se crea una vez en el servidor; **nunca** en git |

No se compila nada en el servidor: los contenedores son imágenes oficiales que ejecutan los archivos de `release/`.

**Secretos:** sin Vault en producción, por ahora. El backend lee las credenciales de `/opt/cv/.env` con
`SECRETS_PROVIDER=env`, por la misma interfaz `SecretStore` (constitución, sección 2). Solo el usuario `deploy` puede leerlo.
Volver a Vault solo cambia esa variable.

## 1. Preparar el servidor (una vez)

Hecho el 2026-11-22. Para repetirlo en otro VPS (plan de mudanza), como root:

1. **SSH solo con clave:** `/etc/ssh/sshd_config.d/00-hardening.conf` con `PasswordAuthentication no`,
   `KbdInteractiveAuthentication no` y `PermitRootLogin prohibit-password`.
2. **Firewall:** `ufw` permite solo SSH, 80/tcp, 443/tcp y 443/udp.
3. **Actualizaciones automáticas:** `unattended-upgrades` activado.
4. **Docker:** Docker Engine + plugin Compose desde el repositorio oficial de Docker.
5. **Usuario `deploy`** en el grupo `docker`, con la clave pública de `cesarcasares_deploy` en `authorized_keys`.
6. **`/opt/cv/.env`** (propietario `deploy`, permisos 600). Las claves se generan en el propio servidor con
   `openssl rand`, nunca se copian a otro sitio:

   ```
   SITE_DOMAIN=cesarcasares.com
   PUBLIC_SITE_URL=https://cesarcasares.com
   ALLOWED_HOSTS=cesarcasares.com,www.cesarcasares.com
   SECRETS_PROVIDER=env
   DATABASE_DATABASE=cv_app
   DATABASE_USERNAME=cv_app
   DATABASE_PASSWORD=<openssl rand -hex 32>
   JWT_SIGNING_KEY=<openssl rand -base64 48>
   IMAGE_BASE_URL=/images/articulos
   GITHUB_USERNAME=cesarcasaresj
   LINKEDIN_PROFILE_URL=https://www.linkedin.com/in/cesarcasaresse/
   # Opcional, "Pregúntale a mi CV" (HU-24): sin clave, el botón no aparece
   ANTHROPIC_API_KEY=<clave de console.anthropic.com>
   ASSISTANT_DAILY_LIMIT=100
   ```

   La clave de la API de Claude se escribe directamente en el servidor (nunca en el chat ni en git) y conviene
   ponerle un **límite de gasto mensual** en la consola de Anthropic (Settings → Limits). Después:
   `docker compose up -d api` para que el backend la lea.

7. **Copia diaria de la base de datos:** `/etc/cron.d/cv-backup` ejecuta `/opt/cv/backup.sh` a las 3:30.
   Guarda las últimas 14 copias en `/var/backups/cv`.
8. **Copia fuera del servidor (Backblaze B2, gratis hasta 10 GB):** `rclone` instalado y `/etc/cv-backup.env`
   (root, permisos 600, nunca en git) con:

   ```
   BACKUP_REMOTE=b2:<nombre-del-bucket>/cv
   RCLONE_CONFIG_B2_TYPE=b2
   RCLONE_CONFIG_B2_ACCOUNT=<keyID de la clave de aplicación>
   RCLONE_CONFIG_B2_KEY=<applicationKey>
   ```

   Con ese archivo, `backup.sh` sube cada copia al bucket (privado) y borra allí las de más de 30 días.
   La clave de aplicación se crea en Backblaze solo para ese bucket, con permiso de lectura y escritura.

## 2. DNS (Cloudflare)

El dominio está registrado en Namecheap, pero su DNS lo gestiona Cloudflare (plan gratuito).

1. Namecheap → Domain List → Manage → **Nameservers: Custom DNS** con los dos de Cloudflare.
2. Cloudflare → DNS → Records:
   - `A  cesarcasares.com  <IP-del-VPS>`
   - `A  www  <IP-del-VPS>`
3. Cloudflare → SSL/TLS → modo **Full (strict)**: Caddy ya tiene un certificado válido en el servidor.
4. Después, los dos registros en **Proxied** (nube naranja). **No** actives "Always Use HTTPS": Caddy ya redirige a HTTPS,
   y esa opción impediría renovar el certificado de Let's Encrypt (la comprobación llega por HTTP).
5. **Clima del visitante (HU-25):** Cloudflare → Rules → Settings → Managed Transforms → activa
   **"Add visitor location headers"**. Así el backend recibe la ciudad aproximada del visitante (`cf-ipcity`,
   `cf-iplatitude`, `cf-iplongitude`) sin enviar su IP a nadie. Sin esto (o con la nube gris), el widget muestra Lima.
6. **Aviso si se cae:** UptimeRobot (gratis) vigila `https://cesarcasares.com/` y `/api/v1/posts/count` cada 5 minutos
   y avisa por correo.

## 3. Secrets en GitHub

Repositorio → Settings → Secrets and variables → Actions:

| Secret | Valor |
|---|---|
| `SSH_HOST` | `<IP-del-VPS>` |
| `SSH_PORT` | `22` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | contenido de `cesarcasares_deploy` (la llave **privada**) |
| `SSH_KNOWN_HOSTS` | salida de `ssh-keyscan -t ed25519 <IP-del-VPS>` |

Variable `SITE_URL` = `https://cesarcasares.com`. Los secretos `API_DIR` y `WEB_DIR` del hosting anterior ya no se usan.

## 4. Cargar tus datos

La base no está abierta a Internet: los scripts se ejecutan desde tu PC por un **túnel SSH**.

1. Túnel (déjalo abierto en una terminal):

   ```powershell
   ssh -i "$HOME\.ssh\cesarcasares_deploy" -N -L 6543:127.0.0.1:5432 deploy@<IP-del-VPS>
   ```

2. `.env.production.local` en la raíz (git lo ignora; **nunca** lo subas) con `SECRETS_PROVIDER=env`,
   `DATABASE_HOST=localhost`, `DATABASE_PORT=6543` y `DATABASE_DATABASE`, `DATABASE_USERNAME` y `DATABASE_PASSWORD`
   copiados de `/opt/cv/.env`.

3. Desde `backend/`:

   ```powershell
   npm run prod -- scripts/load-profile.ts                         # perfil y experiencia
   npm run prod -- scripts/create-user.ts <tu-correo>              # cuenta de autor (AUTHOR_PASSWORD y AUTHOR_NAME)
   npm run prod -- scripts/load-content.ts --author <tu-correo>    # artículos del blog
   ```

   Las categorías de los artículos (Frontend, Arquitectura, Seguridad) deben existir antes: se crean en
   Mi cuenta → Categorías.

## Después: publicar cambios

Haz merge a `main`. GitHub prueba, compila, sube por SSH y reinicia los contenedores. Si las pruebas fallan, no se publica nada.
Para cambiar tus datos, edita `content/perfil/perfil.json` o los artículos y repite el paso 4 (solo el script que corresponda).

## Seguridad de dependencias

- **Dependabot** (`.github/dependabot.yml`) vigila las librerías npm del backend y del frontend, las imágenes del VPS
  y las GitHub Actions. Activa en Settings → Code security: **Dependabot alerts** y **Dependabot security updates**.
  Cuando sale una vulnerabilidad que te afecta, abre un PR con el arreglo; si el CI sale en verde, merge y se publica.
  Los lunes propone además las actualizaciones normales, agrupadas.
- **Imágenes:** cada despliegue hace `docker compose pull`, así que los parches de `postgres:17`, `node:22-alpine` y
  `caddy:2` llegan con el siguiente merge. Los saltos de versión mayor (Postgres 18, Node 24) se hacen a mano.
- **Revisión semanal** (`.github/workflows/security-scan.yml`, lunes 7:00 en Lima, o a mano desde Actions):
  `npm audit` de lo que va a producción y Trivy dentro de las tres imágenes (sin `gosu` ni el npm interno de la imagen de Node, que no se
  ejecutan con datos de fuera). Si hay fallos altos o críticos con
  arreglo publicado, abre un issue "Vulnerabilidades altas o críticas pendientes" (o comenta en el abierto).
- **Avisos oficiales:** suscripción a nodejs.org/en/blog/vulnerability y postgresql.org/support/security.
- **Sistema operativo:** `unattended-upgrades` instala solo los parches de seguridad de Ubuntu.

## Cabeceras de seguridad y endurecimiento

Lo que pone el código (llega con cada despliegue):
- **Páginas** (`frontend/src/security-headers.ts`): Content-Security-Policy con un *nonce* nuevo en cada respuesta
  (solo se ejecutan los scripts que Angular escribe; uno inyectado por un XSS no), `frame-ancestors 'none'` y
  `X-Frame-Options: DENY` contra el clickjacking, `Referrer-Policy`, `Permissions-Policy` y `nosniff`.
- **API** (`backend/src/main.ts`, helmet): `default-src 'none'`, anti-iframe y `nosniff`. Ninguno de los dos envía `X-Powered-By`.
- **Login**: tras 5 fallos seguidos desde la misma IP, cada intento fallido bloquea más tiempo (1, 2, 4… hasta 60 minutos)
  y responde 429 con `Retry-After`. No se bloquea por correo: cualquiera podría dejar al autor fuera a propósito.
- **Caddy** (`deploy/vps/Caddyfile`): HSTS de un año, quita `Server`, `Via` y `X-Powered-By`, y solo acepta
  `CF-Connecting-IP` (la IP real del visitante) cuando la petición viene de un rango de Cloudflare.
  Si Cloudflare publica rangos nuevos (https://www.cloudflare.com/ips/), hay que añadirlos ahí.

Lo que se hace a mano, una vez:
1. **Correo del dominio** (no se usa correo en `cesarcasares.com`): Cloudflare → DNS → Records, dos registros TXT
   para que nadie pueda enviar correos que parezcan tuyos:
   - `TXT  cesarcasares.com  "v=spf1 -all"`
   - `TXT  _dmarc  "v=DMARC1; p=reject; adkim=s; aspf=s"`
2. **Origen solo por Cloudflare:** que el VPS rechace el 80 y el 443 si no vienen de Cloudflare, para que nadie se salte su
   protección llamando a la IP directamente. Con `ufw` (como root), los mismos rangos del Caddyfile para 80/tcp, 443/tcp y 443/udp,
   y después `ufw deny 80,443/tcp`. Ojo: Docker publica puertos saltándose `ufw`; la regla tiene que ir en la cadena
   `DOCKER-USER` de iptables o hacerse con el firewall del panel de Contabo.
3. **Opcional:** Cloudflare → Security → WAF → Rate limiting rules, una regla para `/api/v1/auth/login` (por ejemplo 10 peticiones
   por minuto por IP). Es una segunda capa por delante del freno del backend.

## Si algo falla

- **Estado y errores:** `ssh deploy@<IP-del-VPS>`, luego `cd /opt/cv && docker compose ps` y `docker compose logs api --tail 50`
  (o `web`, `caddy`). Los mensajes nunca muestran valores de secretos.
- **Reiniciar:** `docker compose restart api web`.
- **Restaurar una copia:** como root,
  `gunzip -c /var/backups/cv/<archivo>.sql.gz | docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`.
- **Mudarse a otro servidor:** repite el paso 1 en el nuevo, restaura la última copia, cambia la IP en Cloudflare y en
  `SSH_HOST`/`SSH_KNOWN_HOSTS`, y lanza el despliegue (Actions → Run workflow).
