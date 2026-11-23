#!/bin/sh
# Copia diaria de la base de datos (DEPLOY.md). La programa cron en el servidor:
#   /etc/cron.d/cv-backup → 30 3 * * * root /opt/cv/backup.sh
# Guarda las últimas 14 copias en /var/backups/cv (comprimidas, solo root las lee).
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

# Borra las copias más antiguas
ls -1t "$DIR"/cv-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "Copia guardada: $FILE"
