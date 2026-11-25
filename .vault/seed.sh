#!/bin/sh
# Carga en Vault (modo dev) las credenciales de la base de datos.
# Los valores vienen del .env a través de docker-compose; este archivo no contiene secretos.
set -e

vault kv put secret/cv-app/database \
  host=localhost \
  port=5432 \
  database=cv_app \
  username="$POSTGRES_USER" \
  password="$POSTGRES_PASSWORD"

echo "Secretos cargados en secret/cv-app/database"

# Opcional: clave de la API de Claude para "Pregúntale a mi CV" (HU-24). Sin ella, el asistente queda desactivado.
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  vault kv put secret/cv-app/anthropic api_key="$ANTHROPIC_API_KEY"
  echo "Secretos cargados en secret/cv-app/anthropic"
fi
