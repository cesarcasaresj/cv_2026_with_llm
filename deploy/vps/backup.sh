#!/bin/sh
# Copia diaria de la base de datos (DEPLOY.md). La programa cron en el servidor:
#   /etc/cron.d/cv-backup → 30 3 * * * root /opt/cv/backup.sh
# Guarda las últimas 14 copias en /var/backups/cv (comprimidas, solo root las lee) y, si existe
# /etc/cv-backup.env, sube cada copia fuera del servidor (Backblaze B2 con rclone) y borra allí las de más de 30 días.
set -eu

DIR=/var/backups/cv
KEEP=14
mkdir -p "$DIR"
chmod 700 "$DIR"

FILE="$DIR/cv-$(date +%Y%m%d-%H%M).sql.gz"
cd /opt/cv
# Las credenciales están dentro del contenedor; no pasan por la línea de comandos
docker compose exec -T postgres sh -c 'pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

# Borra las copias locales más antiguas
ls -1t "$DIR"/cv-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "Copia guardada: $FILE"

# Copia fuera del servidor. /etc/cv-backup.env (solo root) define BACKUP_REMOTE (por ejemplo "b2:mi-bucket/cv")
# y las variables RCLONE_CONFIG_B2_* con la clave de aplicación de Backblaze. Nunca está en git.
if [ -f /etc/cv-backup.env ]; then
  set -a
  . /etc/cv-backup.env
  set +a
  rclone copy "$FILE" "$BACKUP_REMOTE" --quiet
  rclone delete "$BACKUP_REMOTE" --min-age 30d --quiet
  echo "Copia subida a $BACKUP_REMOTE"
fi
