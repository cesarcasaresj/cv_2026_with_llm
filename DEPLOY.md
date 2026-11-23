# Publicar en cesarcasares.com (VPS de Contabo con Docker)

Producción corre en un VPS propio (Contabo Cloud VPS 4, Ubuntu 24.04) con Docker Compose.
Se monta una vez; después, cada cambio que llega a `main` se publica solo (GitHub Actions).

## Cómo queda montado

```
Visitante → Cloudflare (DNS, caché, protección) → VPS 169.58.87.83
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
   ```

7. **Copia diaria de la base de datos:** `/etc/cron.d/cv-backup` ejecuta `/opt/cv/backup.sh` a las 3:30.
   Guarda las últimas 14 copias en `/var/backups/cv`.

## 2. DNS (Cloudflare)

El dominio está registrado en Namecheap, pero su DNS lo gestiona Cloudflare (plan gratuito).

1. Namecheap → Domain List → Manage → **Nameservers: Custom DNS** con los dos de Cloudflare.
2. Cloudflare → DNS → Records:
   - `A  cesarcasares.com  169.58.87.83`
   - `A  www  169.58.87.83`
3. Cloudflare → SSL/TLS → modo **Full (strict)**: Caddy ya tiene un certificado válido en el servidor.

## 3. Secrets en GitHub

Repositorio → Settings → Secrets and variables → Actions:

| Secret | Valor |
|---|---|
| `SSH_HOST` | `169.58.87.83` |
| `SSH_PORT` | `22` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | contenido de `cesarcasares_deploy` (la llave **privada**) |
| `SSH_KNOWN_HOSTS` | salida de `ssh-keyscan -t ed25519 169.58.87.83` |

Variable `SITE_URL` = `https://cesarcasares.com`. Los secretos `API_DIR` y `WEB_DIR` del hosting anterior ya no se usan.

## 4. Cargar tus datos

La base no está abierta a Internet: los scripts se ejecutan desde tu PC por un **túnel SSH**.

1. Túnel (déjalo abierto en una terminal):

   ```powershell
   ssh -i "$HOME\.ssh\cesarcasares_deploy" -N -L 6543:127.0.0.1:5432 deploy@169.58.87.83
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

## Si algo falla

- **Estado y errores:** `ssh deploy@169.58.87.83`, luego `cd /opt/cv && docker compose ps` y `docker compose logs api --tail 50`
  (o `web`, `caddy`). Los mensajes nunca muestran valores de secretos.
- **Reiniciar:** `docker compose restart api web`.
- **Restaurar una copia:** como root,
  `gunzip -c /var/backups/cv/<archivo>.sql.gz | docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`.
- **Mudarse a otro servidor:** repite el paso 1 en el nuevo, restaura la última copia, cambia la IP en Cloudflare y en
  `SSH_HOST`/`SSH_KNOWN_HOSTS`, y lanza el despliegue (Actions → Run workflow).
