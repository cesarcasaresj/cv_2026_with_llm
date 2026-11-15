-- Sesiones activas. Cada JWT lleva el id de su fila: así el logout revoca el token en el servidor
-- aunque alguien lo haya copiado antes (spec.md, HU-03).

CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
